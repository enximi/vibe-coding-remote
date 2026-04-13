#[tokio::main]
async fn main() {
    let options = voice_bridge_desktop_server::parse_runtime_options();
    if let Err(error) = voice_bridge_desktop_server::run(options).await {
        eprintln!("{error}");
        std::process::exit(1);
    }
}
