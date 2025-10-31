use std::sync::Arc;
use base::db::Store;
use futures::SinkExt;
use tokio::sync::mpsc::{self};
use futures::stream::{SplitSink, StreamExt};
use axum::{extract::{ws::{Message, WebSocket}, Path, State, WebSocketUpgrade}, response::Response, routing::{any, get}, Router};
use tokio_util::sync::CancellationToken;
use crate::{err::AppResult, model::{Kid, SvcRsp}, util::{b64_url_u8_32, u8_b64}};
use crate::model::WsMsg;
use super::AppCtx;

const USER_CH_SIZE: usize = 100;
pub const INVITATION_TBL: &str = "Invitation";
pub const TEMP_PRIV_TBL: &str = "Temp-Priv-Chat";
pub const TEMP_MEDIA_TBL: &str = "Temp-Media";

pub type UserTxs = dashmap::DashMap<Kid, mpsc::Sender<WsMsg>>;

pub fn router() -> Router<Arc<AppCtx>> {
    Router::new()
        .route("/hi", get(|| async { "Hello, World!" }))
        .route("/{nick}/k/{kid}", any(ws_handler))
}
async fn ws_handler(ws: WebSocketUpgrade, State(state): State<Arc<AppCtx>>, Path((nick,kid)): Path<(String,String)>) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, state, nick, kid))
}
async fn handle_socket(socket: WebSocket, state: Arc<AppCtx>, nick: String, kid_safe: String) {
    let kid_buf = b64_url_u8_32(&kid_safe)
        .unwrap_or_else(|_| panic!("Invalid KID: {kid_safe} for {nick}"));
    let kid_local = u8_b64(&kid_buf);
    let (mut sender, mut receiver) = socket.split();

    let (i_tx, mut i_rx) = mpsc::channel::<WsMsg>(USER_CH_SIZE);
    let token = CancellationToken::new();
    
    state.user_txs.insert(kid_buf, i_tx.clone());

    //send cached msgs
    let mut send_cached_msgs = async |tbl: &str| {
        if let Ok(cached_inv_msgs) = state.store.find_in::<Vec<WsMsg>>(tbl, &kid_local){
            for ws_msg in cached_inv_msgs {
                send_to_client(&ws_msg, &mut sender).await;
            }
            if let Err(e) = state.store.remove_in(tbl, &kid_local) { //clear
                log::error!("remove cached msgs failed, err: {e:?}");
            } 
        }
    };
    for tbl in [INVITATION_TBL, TEMP_PRIV_TBL, TEMP_MEDIA_TBL] {
        send_cached_msgs(tbl).await;
    }
    
    // Set up message forwarding
    let task_token = token.clone();
    tokio::spawn(async move { // rendezvous point
        tokio::select! {
            _ = task_token.cancelled() => {
                // println!("ws::task_group aborted");
            },
            _ = async { //self-talks & room chat
                while let Some(msg) = i_rx.recv().await {
                    // println!("sending: {msg:?}");
                    if !send_to_client(&msg, &mut sender).await { break }
                }
            } => { task_token.cancel(); }, 
        }
    });

    tokio::select! {
        _ = token.cancelled() => {
            // println!("ws::msg_handler aborted");
        },
        _ = async {
            // Handle incoming messages
            while let Some(Ok(Message::Binary(data))) = receiver.next().await {
                // let mut de = rmp_serde::Deserializer::from_read_ref(&data).with_human_readable();
                // let rmp_msg_result = Deserialize::deserialize(&mut de);
                if let Ok(ws_msg) = rmp_serde::from_slice::<WsMsg>(&data){
                    // println!("recv ws_msg: {ws_msg:?}");
                    match ws_msg {
                        WsMsg::Bye => break,
                        WsMsg::Media { ref kid,  .. } => { //only for priv-chat currently
                            // println!("Media Msg:{kid}");
                            if let Some(kid_tx) = state.user_txs.get(kid){
                                if kid_tx.send(ws_msg.clone()).await.is_err() { break }
                            }else if cache_msg(&state.store, TEMP_MEDIA_TBL, &u8_b64(kid),  ws_msg).is_err() { break }
                        }
                        WsMsg::PrivChat { ref kid,  ..  } => {
                            if i_tx.send(ws_msg.clone()).await.is_err() { break } //send to me
                            if let Some(kid_tx) = state.user_txs.get(kid) {
                                if kid_tx.send(ws_msg).await.is_err() {  break }  //sent ok
                            }else { //offline msg
                                if cache_msg(&state.store, TEMP_PRIV_TBL, &u8_b64(kid), ws_msg).is_err() {break}
                                if i_tx.send(WsMsg::Rsp(SvcRsp::Offline)).await.is_err() { break }
                            }
                        },
                        WsMsg::InviteTracking { ref kid, .. } | WsMsg::Engagement { ref kid, .. } => {
                            if let Some(kid_tx) = state.user_txs.get(kid){ //online
                                 if kid_tx.send(ws_msg.clone()).await.is_err() { break }
                            }else { //offline, should cached invitation msg for better user experience
                                if cache_msg(&state.store, INVITATION_TBL, &u8_b64(kid), ws_msg).is_err() { break }
                            }
                        },
                        _ => {}
                    }
                }
            }
        } => { token.cancel();}
    }

    // println!("rm_users: {:?}", state.rm_users);
    state.user_txs.remove(&kid_buf);
    token.cancel();
    println!("{nick} is offline");
}
async fn send_to_client(msg: &WsMsg, sender: &mut SplitSink<WebSocket,Message>) -> bool {
    match rmp_serde::to_vec_named(msg) {
        Ok(enc) => {
            if sender.send(Message::Binary(enc.into())).await.is_err() {
                return false;
            }
        }
        Err(e) => {
            log::error!("try encode msg failed. err: {e}");
        },
    }
    true
}
fn cache_msg(store: &Store, tbl: &str, kid_b64: &str, ws_msg: WsMsg) -> AppResult<()>{
    match store.find_in::<Vec<WsMsg>>(tbl, kid_b64) {
        Ok(mut ws_msgs) => {
            if ws_msgs.contains(&ws_msg) { //should replace with new one
                ws_msgs.iter_mut().find(|m| *m == &ws_msg).map(|_| ws_msg);
            }else{
                ws_msgs.push(ws_msg);
                store.save_in(tbl, kid_b64, &ws_msgs)?;
            }
        }
        Err(_e) => {
            store.save_in(tbl, kid_b64, &vec![ws_msg])?;
        }
    };
    Ok(())
}
