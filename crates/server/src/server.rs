use crate::{
    RuntimeOptions, import_config, input, network,
    protocol::{ActionValidationError, ApiResponse, ServerActionRequest},
    qr,
};
use axum::{
    Json, Router,
    extract::{DefaultBodyLimit, State},
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use std::{net::SocketAddr, sync::Arc};
use thiserror::Error;
use tower_http::cors::CorsLayer;

const MAX_REQUEST_BODY_BYTES: usize = 64 * 1024;

#[derive(Debug, Clone)]
struct AppState {
    auth_token: Arc<str>,
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
    let app = build_router(options.auth_token.clone());

    tracing::info!("Vibe Coding Remote server is starting");
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|source| ServerError::Bind { addr, source })?;
    log_startup_guide(&options);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .map_err(ServerError::Serve)
}

fn build_router(auth_token: String) -> Router {
    Router::new()
        .route("/api/action", post(execute_action))
        .route("/api/auth-check", get(auth_check))
        .route("/health", get(health))
        .layer(CorsLayer::permissive())
        .layer(DefaultBodyLimit::max(MAX_REQUEST_BODY_BYTES))
        .with_state(AppState {
            auth_token: Arc::<str>::from(auth_token),
        })
}

fn log_startup_guide(options: &RuntimeOptions) {
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

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
    tracing::info!("Vibe Coding Remote server stopped");
}

async fn health() -> &'static str {
    "ok"
}

async fn auth_check(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Json<ApiResponse>, AppError> {
    authorize(&headers, state.auth_token.as_ref())?;
    tracing::info!("auth check succeeded");
    Ok(Json(ApiResponse { ok: true }))
}

async fn execute_action(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<ServerActionRequest>,
) -> Result<Json<ApiResponse>, AppError> {
    authorize(&headers, state.auth_token.as_ref())?;

    let action = payload.action.validate().map_err(|error| {
        tracing::warn!(error = %error, "rejected invalid action");
        AppError::bad_request(error)
    })?;
    let debug_action = format!("{action:?}");

    input::execute_action(action).map_err(|error| {
        tracing::error!(error = %error, action = %debug_action, "failed to execute action");
        AppError::input_failed(error)
    })?;

    tracing::info!(action = %debug_action, "executed action");

    Ok(Json(ApiResponse { ok: true }))
}

fn authorize(headers: &HeaderMap, expected_token: &str) -> Result<(), AppError> {
    let authorization = headers
        .get(header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .ok_or_else(|| {
            tracing::warn!("rejected request with missing authorization token");
            AppError::unauthorized()
        })?;
    let token = authorization.strip_prefix("Bearer ").ok_or_else(|| {
        tracing::warn!("rejected request with invalid authorization scheme");
        AppError::unauthorized()
    })?;

    if token == expected_token {
        Ok(())
    } else {
        tracing::warn!("rejected request with invalid authorization token");
        Err(AppError::unauthorized())
    }
}

struct AppError {
    status: StatusCode,
    message: String,
}

impl AppError {
    fn bad_request(error: impl ToString) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            message: error.to_string(),
        }
    }

    fn unauthorized() -> Self {
        Self {
            status: StatusCode::UNAUTHORIZED,
            message: "missing or invalid authorization token".to_owned(),
        }
    }

    fn input_failed(error: input::InputError) -> Self {
        Self {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            message: error.to_string(),
        }
    }
}

impl From<ActionValidationError> for AppError {
    fn from(error: ActionValidationError) -> Self {
        Self::bad_request(error)
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (self.status, self.message).into_response()
    }
}
