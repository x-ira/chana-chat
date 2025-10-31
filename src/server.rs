use std::sync::Arc;
use axum::Router;
use dashmap::DashMap;
use tower_http::services::{ServeDir, ServeFile};
use base::db::Store;

use crate::{err::AppResult, router::{self, ws::{INVITATION_TBL, TEMP_MEDIA_TBL, TEMP_PRIV_TBL}, AppCtx}};

pub async fn start_chat_server(app_name: &str, port:u16, store: Arc<Store>) -> AppResult<()>{
    let listen_on: String = format!("0.0.0.0:{port}");
    
    //init to avoid find fail 
    store.save_in(INVITATION_TBL, "", &0)?;
    store.save_in(TEMP_MEDIA_TBL, "", &0)?;
    store.save_in(TEMP_PRIV_TBL, "", &0)?;
    
    let state = Arc::new(AppCtx{
        store,
        user_txs: DashMap::new(),
    });

    log::info!("[{app_name}] stated. listening on <{listen_on}>");
    let dist_dir = ServeDir::new("dist").fallback(ServeFile::new("dist/index.html")); // fallback for cliet router!
    let res_dir = ServeDir::new("res").fallback(ServeFile::new("res/default.png"));

    let app = Router::new()
        .nest_service("/res", res_dir)
        .route_service("/", dist_dir.clone()).fallback_service(dist_dir) //fallback_svc for assets
        .nest("/ws", router::ws::router()) //only dec content of msg
        .with_state(state);

    match tokio::net::TcpListener::bind(listen_on).await {
        Ok(listener) => {
            if let Err(e) = axum::serve(listener, app).await{
                log::error!("{e:?}");
            }
        }
        Err(e) => {
            log::error!("{e:?}");
        },
    }
    Ok(())
}
