mod router;
mod model;
mod err;
mod server;
mod util;

use std::sync::Arc;
use air::conf::cfg;
use base::db::Store;
use err::AppResult;
use server::start_chat_server;

#[tokio::main]
async fn main() -> AppResult<()> {
    let _logger = air::logger::def_init();
    let app = cfg::<String>("app.name");
    let lan_port = cfg::<u16>("app.lan_port");
    let store = Arc::new(Store::new(&app));

    start_chat_server(&app, lan_port, store).await
}
