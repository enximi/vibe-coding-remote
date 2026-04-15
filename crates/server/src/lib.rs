mod action;
mod cli;
mod input;
mod network;
mod runtime;
mod server;

pub use runtime::{RuntimeError, RuntimeOptions, parse_runtime_options};
pub use server::ServerError;

pub async fn run(options: RuntimeOptions) -> Result<(), ServerError> {
    server::run(options).await
}
