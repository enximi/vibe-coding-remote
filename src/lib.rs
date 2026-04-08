mod input;
mod network;
mod server;
mod web_assets;

pub async fn run() {
    server::run().await;
}
