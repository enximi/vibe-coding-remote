use crate::{input, network, web_assets};
use axum::{
    Json, Router,
    extract::DefaultBodyLimit,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, post},
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;

const SERVER_PORT: u16 = 8765;

#[derive(Debug, Deserialize)]
struct TypeTextRequest {
    text: String,
}

#[derive(Debug, Deserialize)]
struct PressKeyRequest {
    key: PressKeyName,
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "kebab-case")]
enum PressKeyName {
    Enter,
    Tab,
    Backspace,
}

#[derive(Debug, Serialize)]
struct ApiResponse {
    ok: bool,
}

pub async fn run() {
    let app = build_router();
    let addr = SocketAddr::from(([0, 0, 0, 0], SERVER_PORT));

    println!("VoiceBridge local server is starting...");
    let recommended_url = network::print_access_urls(addr.port());
    println!(
        "RPC API:     http://127.0.0.1:{}/api/type-text",
        addr.port()
    );
    println!(
        "RPC API:     http://127.0.0.1:{}/api/press-key",
        addr.port()
    );
    network::print_startup_qr(recommended_url.as_deref());

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind TCP listener");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("server error");
}

fn build_router() -> Router {
    Router::new()
        .route("/", get(web_assets::index))
        .route("/app.js", get(web_assets::app_js))
        .route("/styles.css", get(web_assets::styles_css))
        .route("/manifest.webmanifest", get(web_assets::manifest))
        .route("/api/type-text", post(type_text))
        .route("/api/press-key", post(press_key))
        .route("/health", get(health))
        .layer(DefaultBodyLimit::max(64 * 1024))
}

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
    println!("\nVoiceBridge local server stopped.");
}

async fn health() -> &'static str {
    "ok"
}

async fn type_text(Json(payload): Json<TypeTextRequest>) -> Result<Json<ApiResponse>, AppError> {
    let text = payload.text.trim();
    if text.is_empty() {
        return Err(AppError::bad_request("text cannot be empty"));
    }

    input::type_text(text).map_err(AppError::input_failed)?;

    println!("\n--- type_text ---\ntext: {}\n-----------------", text);

    Ok(Json(ApiResponse { ok: true }))
}

async fn press_key(Json(payload): Json<PressKeyRequest>) -> Result<Json<ApiResponse>, AppError> {
    input::press_key(payload.key.into()).map_err(AppError::input_failed)?;

    println!(
        "\n--- press_key ---\nkey: {:?}\n-----------------",
        payload.key
    );

    Ok(Json(ApiResponse { ok: true }))
}

impl From<PressKeyName> for input::PressKey {
    fn from(value: PressKeyName) -> Self {
        match value {
            PressKeyName::Enter => Self::Enter,
            PressKeyName::Tab => Self::Tab,
            PressKeyName::Backspace => Self::Backspace,
        }
    }
}

struct AppError {
    status: StatusCode,
    message: String,
}

impl AppError {
    fn bad_request(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            message: message.into(),
        }
    }

    fn input_failed(error: input::InputError) -> Self {
        Self {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            message: error.to_string(),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (self.status, self.message).into_response()
    }
}
