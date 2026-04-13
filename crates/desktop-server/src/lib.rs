mod cli;
mod input;
mod network;
mod server;
mod web_assets;

pub use cli::{FrontendMode, RuntimeOptions, parse_runtime_options};

pub async fn run(options: RuntimeOptions) -> Result<(), String> {
    server::run(options).await
}

pub async fn run_embedded() -> Result<(), String> {
    run(RuntimeOptions {
        frontend_mode: FrontendMode::Embedded,
    })
    .await
}
