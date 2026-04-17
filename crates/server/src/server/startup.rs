use crate::{RuntimeOptions, import_config, network, qr};

pub(super) fn log_startup_guide(options: &RuntimeOptions) {
    let host = options.host;
    let api_port = options.port;

    tracing::info!("API server");
    let access_status = network::log_access_urls(host, api_port);
    tracing::info!(url = %format!("http://127.0.0.1:{api_port}/health"), "health endpoint");
    tracing::info!(url = %format!("http://127.0.0.1:{api_port}/api/auth-check"), "auth check endpoint");
    tracing::info!(url = %format!("http://127.0.0.1:{api_port}/api/action"), "action endpoint");
    tracing::info!("Bearer token required for /api/auth-check and /api/action");
    tracing::info!("CORS enabled for cross-origin frontend clients");
    log_import_guide(options, access_status);
}

fn log_import_guide(options: &RuntimeOptions, access_status: network::ImportEndpointStatus) {
    match access_status {
        network::ImportEndpointStatus::Available { endpoint } => {
            match import_config::ImportConfig::new(endpoint.clone(), options.auth_token.clone()) {
                Ok(config) => {
                    tracing::info!(endpoint = %config.payload.endpoint, "mobile import endpoint");
                    tracing::warn!(
                        import_url = %config.import_url,
                        "mobile import URL contains the auth token; treat it as sensitive"
                    );

                    match qr::render_qr_text(&config.import_url) {
                        Ok(qr_text) => {
                            tracing::info!(
                                "scan this QR code in the app to import the server config"
                            );
                            tracing::info!("\n{qr_text}");
                        }
                        Err(error) => {
                            tracing::warn!(error = %error, "failed to render import QR code");
                        }
                    }
                }
                Err(error) => {
                    tracing::warn!(error = %error, "failed to prepare import configuration");
                }
            }
        }
        network::ImportEndpointStatus::LoopbackOnly => {
            tracing::warn!("mobile import QR unavailable because the server is bound to localhost");
            tracing::warn!("restart with --host 0.0.0.0 to allow phones on the LAN to connect");
        }
        network::ImportEndpointStatus::NoLanAddress => {
            tracing::warn!(
                "mobile import QR unavailable because no private LAN IPv4 address was found"
            );
        }
    }
}
