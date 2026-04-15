mod action;
mod cli;
mod input;
mod network;
mod runtime;
mod server;

pub use runtime::{RuntimeOptions, parse_runtime_options};

pub async fn run(options: RuntimeOptions) -> Result<(), String> {
    server::run(options).await
}
