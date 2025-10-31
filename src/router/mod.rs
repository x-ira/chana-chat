pub mod ws;

use std::sync::Arc;
use base::db::Store;
use crate::router::ws::UserTxs;

pub struct AppCtx {
  pub store: Arc<Store>,
  pub user_txs: UserTxs, //for Priv-Chat
}
