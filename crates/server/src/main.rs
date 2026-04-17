#[tokio::main]
async fn main() {
    init_logging();

    let command = match vibe_coding_remote_server::parse_runtime_command() {
        Ok(command) => command,
        Err(error) => {
            tracing::error!("{error}");
            std::process::exit(1);
        }
    };

    match command {
        vibe_coding_remote_server::RuntimeCommand::RunServer(options) => {
            if let Err(error) = vibe_coding_remote_server::run(options).await {
                tracing::error!("{error}");
                std::process::exit(1);
            }
        }
        vibe_coding_remote_server::RuntimeCommand::ExportTypes { output_path } => {
            match vibe_coding_remote_server::export_typescript_bindings(output_path) {
                Ok(path) => tracing::info!(path = %path.display(), "exported TypeScript bindings"),
                Err(error) => {
                    tracing::error!("{error}");
                    std::process::exit(1);
                }
            }
        }
    }
}

fn init_logging() {
    let env_filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("vibe_coding_remote_server=info"));

    tracing_subscriber::fmt()
        .with_env_filter(env_filter)
        .with_target(false)
        .compact()
        .init();
}
