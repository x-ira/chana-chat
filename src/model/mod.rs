use std::hash::{DefaultHasher, Hash, Hasher};
use serde::{Deserialize, Serialize};
use serde_bytes::ByteBuf;

pub type Kid = [u8;32];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SvcRsp {
    Output(String),
    Stat{ onlines: usize },
    Offline,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum WsMsg {
    Bye,
    PrivChat{ kid: Kid, msg: Msg}, 
    Media { kid: Kid, by_kid: Kid, id: String, cont_type: String, data: ByteBuf },
    Engagement { kid: Kid, pub_key: Kid,  by_kid: Kid, by_nick: String, by_pub_key: Kid, sign: ByteBuf, ts: i64}, //priv-chat
    InviteTracking { kid: Kid, by_kid: Kid, by_nick: String, state: u8, sign: ByteBuf, ts:i64, tracker: Option<Kid> }, //priv-chat
    // Welcome { nick: String, kid: Kid },
    Rsp(SvcRsp), // rsp of a svc-call
}
impl WsMsg {
    fn hash(&self) -> Option<u64> {
        let mut hasher = DefaultHasher::new();
        match self {
            WsMsg::PrivChat { kid, msg } => {
                msg.hash(&mut hasher);
                kid.hash(&mut hasher);
            },
            WsMsg::Media { kid, by_kid, id, .. } => {
                kid.hash(&mut hasher);
                by_kid.hash(&mut hasher);
                id.hash(&mut hasher);
            },
            _ => { return None}
        }
        Some(hasher.finish())
    }
    fn is_inv(&self) -> Option<([u8;32], u8)>{
        match self {
            WsMsg::InviteTracking { by_kid, state, ..} => {
                Some((*by_kid, *state))
            },
            WsMsg::Engagement { by_kid, ..} => {
                Some((*by_kid, 5))
            },
            _ => { None}
        }
    }
}
impl PartialEq for WsMsg {
    fn eq(&self, other: &Self) -> bool {
        if let Some(inv) = self.is_inv()
            && let Some(inv_other) = other.is_inv() {
                return inv == inv_other
            }
        if let Some(hash) = self.hash()
            && let Some(hash_other) = other.hash() {
                return hash == hash_other
            }
        self == other
    }
}
#[derive(Debug, Clone, Serialize, Deserialize, Hash)]
pub struct Msg {
    pub nick: String, //sender
    pub kid: Kid, //sender
    #[serde(with = "serde_bytes")]
    pub cont: ByteBuf,
    pub kind: MsgKind,
    pub ts: i64,
    pub wisper: Option<Kid>, //wisperer kid
}

#[derive(Debug, Clone, Serialize, Deserialize, Hash)]
pub enum MsgKind {
    Txt,
    Img,
    Voi,
    File,
    // Aud,
    // Vid,
}

#[test]
/// cargo t -- --test <fn_name>
fn serde_nanoid() {
    // println!("{}");
}
