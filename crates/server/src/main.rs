#[tokio::main]
async fn main() {
    init_logging();

    let options = match voice_bridge_server::parse_runtime_options() {
        Ok(options) => options,
        Err(error) => {
            tracing::error!("{error}");
            std::process::exit(1);
        }
    };

    if let Err(error) = voice_bridge_server::run(options).await {
        tracing::error!("{error}");
        std::process::exit(1);
    }
}

fn init_logging() {
    let env_filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("voice_bridge_server=info"));

    tracing_subscriber::fmt()
        .with_env_filter(env_filter)
        .with_target(false)
        .compact()
        .init();
}
