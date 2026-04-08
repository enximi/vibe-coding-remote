use crate::{input, network, web_assets};
use axum::{
    Json, Router,
    extract::DefaultBodyLimit,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{get, get_service, post},
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tower_http::services::{ServeDir, ServeFile};

const SERVER_PORT: u16 = 8765;
const VITE_DEV_PORT: u16 = 5173;

#[derive(Debug, Deserialize)]
struct TypeTextRequest {
    text: String,
}

#[derive(Debug, Deserialize)]
struct PressKeyRequest {
    key: InputActionName,
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "kebab-case")]
enum InputActionName {
    Enter,
    Tab,
    Backspace,
    Copy,
    Paste,
    Newline,
}

#[derive(Debug, Serialize)]
struct ApiResponse {
    ok: bool,
}

pub async fn run() {
    let app = build_router();
    let addr = SocketAddr::from(([0, 0, 0, 0], SERVER_PORT));

    println!("VoiceBridge local server is starting...");
    let frontend_url = print_startup_guide(addr.port());

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind TCP listener");

    network::print_startup_qr(frontend_url.as_deref());

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("server error");
}

fn build_router() -> Router {
    let static_files = ServeDir::new(web_assets::frontend_dist_dir())
        .not_found_service(ServeFile::new(web_assets::frontend_index_file()));

    Router::new()
        .route("/api/type-text", post(type_text))
        .route("/api/press-key", post(press_key))
        .route("/health", get(health))
        .fallback_service(get_service(static_files))
        .layer(DefaultBodyLimit::max(64 * 1024))
}

fn print_startup_guide(api_port: u16) -> Option<String> {
    println!(
        "
API server:"
    );
    let api_url = network::print_access_urls(api_port);
    println!("RPC API:     http://127.0.0.1:{api_port}/api/type-text");
    println!("RPC API:     http://127.0.0.1:{api_port}/api/press-key");

    if cfg!(debug_assertions) {
        println!(
            "
Frontend (development):"
        );
        let frontend_url = network::print_access_urls(VITE_DEV_PORT);
        println!(
            "Mode:        use Vite directly in development; Rust serves only API and production assets"
        );
        frontend_url
    } else {
        println!(
            "
Frontend (production):"
        );
        println!("Mode:        built assets -> frontend/dist");
        api_url
    }
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
    input::perform_action(payload.key.into()).map_err(AppError::input_failed)?;

    println!(
        "\n--- press_key ---\nkey: {:?}\n-----------------",
        payload.key
    );

    Ok(Json(ApiResponse { ok: true }))
}

impl From<InputActionName> for input::InputAction {
    fn from(value: InputActionName) -> Self {
        match value {
            InputActionName::Enter => Self::Enter,
            InputActionName::Tab => Self::Tab,
            InputActionName::Backspace => Self::Backspace,
            InputActionName::Copy => Self::Copy,
            InputActionName::Paste => Self::Paste,
            InputActionName::Newline => Self::Newline,
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
