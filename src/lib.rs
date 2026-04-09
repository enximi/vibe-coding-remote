mod cli;
mod input;
mod network;
mod server;
mod web_assets;

pub use cli::{FrontendMode, RuntimeOptions, parse_runtime_options};

pub async fn run(options: RuntimeOptions) {
    server::run(options).await;
}
