#[tokio::main]
async fn main() {
    let options = voice_bridge::parse_runtime_options();
    voice_bridge::run(options).await;
}
