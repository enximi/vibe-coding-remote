use crate::{FrontendMode, RuntimeOptions, input, network, web_assets};
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
const DEV_FRONTEND_PORT: u16 = 5173;
const MAX_REQUEST_BODY_BYTES: usize = 64 * 1024;

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

pub async fn run(options: RuntimeOptions) -> Result<(), String> {
    let app = build_router(options.frontend_mode);
    let addr = SocketAddr::from(([0, 0, 0, 0], SERVER_PORT));

    println!("VoiceBridge local server is starting...");
    let frontend_url = print_startup_guide(addr.port(), options.frontend_mode);

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|error| format!("failed to bind TCP listener on port {SERVER_PORT}: {error}"))?;

    network::print_startup_qr(frontend_url.as_deref());

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .map_err(|error| format!("server error: {error}"))
}

fn build_router(frontend_mode: FrontendMode) -> Router {
    let api_router = Router::new()
        .route("/api/type-text", post(type_text))
        .route("/api/press-key", post(press_key))
        .route("/health", get(health))
        .layer(DefaultBodyLimit::max(MAX_REQUEST_BODY_BYTES));

    web_assets::install(api_router, frontend_mode)
}

fn print_startup_guide(api_port: u16, frontend_mode: FrontendMode) -> Option<String> {
    print_section_heading("API server");
    let api_url = network::print_access_urls(api_port);
    println!("RPC API:     http://127.0.0.1:{api_port}/api/type-text");
    println!("RPC API:     http://127.0.0.1:{api_port}/api/press-key");

    match frontend_mode {
        FrontendMode::Dev => {
            print_section_heading("Frontend (dev)");
            let frontend_url = network::print_access_urls(DEV_FRONTEND_PORT);
            println!("Mode:        dev");
            println!("Frontend:    access the Vite dev server directly");
            println!("Proxy:       /api -> http://127.0.0.1:{api_port}");
            frontend_url
        }
        FrontendMode::Embedded => {
            print_section_heading("Frontend (embedded)");
            println!("Mode:        embedded");
            println!("Frontend:    Rust serves frontend assets embedded in the executable");
            api_url
        }
    }
}

fn print_section_heading(title: &str) {
    println!();
    println!("{title}:");
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
