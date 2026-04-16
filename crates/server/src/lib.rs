mod cli;
mod export;
mod input;
mod network;
mod protocol;
mod runtime;
mod server;

pub use export::{ExportError, export_typescript_bindings};
pub use runtime::{
    RuntimeCommand, RuntimeError, RuntimeOptions, parse_runtime_command, parse_runtime_options,
};
pub use server::ServerError;

pub async fn run(options: RuntimeOptions) -> Result<(), ServerError> {
    server::run(options).await
}
