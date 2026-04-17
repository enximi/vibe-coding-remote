mod auth;
mod error;
mod handlers;
mod router;
mod startup;

use crate::RuntimeOptions;
use std::{net::SocketAddr, sync::Arc};
use thiserror::Error;

#[derive(Debug, Clone)]
pub(super) struct AppState {
    pub auth_token: Arc<str>,
}

#[derive(Debug, Error)]
pub enum ServerError {
    #[error("failed to bind TCP listener on {addr}: {source}")]
    Bind {
        addr: SocketAddr,
        #[source]
        source: std::io::Error,
    },
    #[error("server error: {0}")]
    Serve(#[source] std::io::Error),
}

pub async fn run(options: RuntimeOptions) -> Result<(), ServerError> {
    let addr = SocketAddr::new(options.host, options.port);
    let app = router::build_router(options.auth_token.clone());

    tracing::info!("Vibe Coding Remote server is starting");
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|source| ServerError::Bind { addr, source })?;
    startup::log_startup_guide(&options);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .map_err(ServerError::Serve)
}

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
    tracing::info!("Vibe Coding Remote server stopped");
}
