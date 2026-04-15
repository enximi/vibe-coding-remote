use crate::{
    RuntimeOptions,
    action::{ActionRequest, ActionValidationError},
    input, network,
};
use axum::{
    Json, Router,
    extract::{DefaultBodyLimit, State},
    http::{HeaderMap, StatusCode, header},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use serde::Serialize;
use std::{net::SocketAddr, sync::Arc};
use thiserror::Error;
use tower_http::cors::CorsLayer;

const MAX_REQUEST_BODY_BYTES: usize = 64 * 1024;

#[derive(Debug, Clone)]
struct AppState {
    auth_token: Arc<str>,
}

#[derive(Debug, Serialize)]
struct ApiResponse {
    ok: bool,
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

    tracing::info!("Voice Bridge server is starting");
    log_startup_guide(options.host, options.port);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|source| ServerError::Bind { addr, source })?;

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .map_err(ServerError::Serve)
}

fn build_router(auth_token: String) -> Router {
    Router::new()
        .route("/api/action", post(execute_action))
        .route("/health", get(health))
        .layer(CorsLayer::permissive())
        .layer(DefaultBodyLimit::max(MAX_REQUEST_BODY_BYTES))
        .with_state(AppState {
            auth_token: Arc::<str>::from(auth_token),
        })
}

fn log_startup_guide(host: std::net::IpAddr, api_port: u16) {
    tracing::info!("API server");
    network::log_access_urls(host, api_port);
    tracing::info!(url = %format!("http://127.0.0.1:{api_port}/health"), "health endpoint");
    tracing::info!(url = %format!("http://127.0.0.1:{api_port}/api/action"), "action endpoint");
    tracing::info!("Bearer token required for /api/action");
    tracing::info!("CORS enabled for cross-origin frontend clients");
}

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
    tracing::info!("Voice Bridge server stopped");
}

async fn health() -> &'static str {
    "ok"
}

async fn execute_action(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<ActionRequest>,
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
