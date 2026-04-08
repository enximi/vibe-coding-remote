use crate::{input, network, web_assets};
use axum::{
    Json, Router,
    body::Body,
    extract::{DefaultBodyLimit, Request},
    http::{HeaderMap, HeaderValue, Method, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::{convert::Infallible, net::SocketAddr, time::Duration};
use tower::{ServiceExt, service_fn};
use tower_http::services::{ServeDir, ServeFile};

const SERVER_PORT: u16 = 8765;

#[derive(Clone)]
struct Frontend {
    dev_server_url: Option<String>,
    http_client: Client,
}

struct FrontendRequestMeta {
    method: Method,
    path_and_query: String,
    accept: Option<HeaderValue>,
    user_agent: Option<HeaderValue>,
}

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
    let frontend = Frontend::new();
    let app = build_router(frontend.clone());
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
    frontend.print_startup_mode();
    network::print_startup_qr(recommended_url.as_deref());

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind TCP listener");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("server error");
}

fn build_router(frontend: Frontend) -> Router {
    let frontend_fallback = service_fn(move |request: Request<Body>| {
        let frontend = frontend.clone();
        async move { Ok::<_, Infallible>(frontend.handle_request(request).await) }
    });

    Router::new()
        .route("/api/type-text", post(type_text))
        .route("/api/press-key", post(press_key))
        .route("/health", get(health))
        .fallback_service(frontend_fallback)
        .layer(DefaultBodyLimit::max(64 * 1024))
}

impl FrontendRequestMeta {
    fn from_request(request: &Request<Body>) -> Self {
        Self {
            method: request.method().clone(),
            path_and_query: request
                .uri()
                .path_and_query()
                .map(|value| value.as_str().to_string())
                .unwrap_or_else(|| "/".to_string()),
            accept: request.headers().get("accept").cloned(),
            user_agent: request.headers().get("user-agent").cloned(),
        }
    }
}

impl Frontend {
    fn new() -> Self {
        Self {
            dev_server_url: web_assets::frontend_dev_server_url(),
            http_client: Client::builder()
                .connect_timeout(Duration::from_millis(300))
                .timeout(Duration::from_secs(5))
                .build()
                .expect("failed to build frontend HTTP client"),
        }
    }

    fn print_startup_mode(&self) {
        if let Some(url) = &self.dev_server_url {
            println!(
                "Frontend:    dev proxy -> {} (fallback: frontend/dist)",
                url
            );
        } else {
            println!("Frontend:    built assets -> frontend/dist");
        }
    }

    async fn handle_request(&self, request: Request<Body>) -> Response {
        let request_meta = FrontendRequestMeta::from_request(&request);

        if let Some(response) = self.try_proxy_to_dev_server(request_meta).await {
            return response;
        }

        self.serve_built_assets(request).await
    }

    async fn try_proxy_to_dev_server(&self, request: FrontendRequestMeta) -> Option<Response> {
        let dev_server_url = self.dev_server_url.as_ref()?;

        if !matches!(request.method, Method::GET | Method::HEAD) {
            return None;
        }

        let target_url = format!("{dev_server_url}{}", request.path_and_query);
        let mut upstream_request = self.http_client.request(request.method, target_url);

        if let Some(accept) = request.accept {
            upstream_request = upstream_request.header("accept", accept);
        }

        if let Some(user_agent) = request.user_agent {
            upstream_request = upstream_request.header("user-agent", user_agent);
        }

        let upstream_response = match upstream_request.send().await {
            Ok(response) => response,
            Err(_) => return None,
        };

        Some(build_proxy_response(upstream_response).await)
    }

    async fn serve_built_assets(&self, request: Request<Body>) -> Response {
        let service = ServeDir::new(web_assets::frontend_dist_dir())
            .not_found_service(ServeFile::new(web_assets::frontend_index_file()));

        match service.oneshot(request).await {
            Ok(response) => response.into_response(),
            Err(error) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                format!("failed to serve frontend assets: {error}"),
            )
                .into_response(),
        }
    }
}

async fn build_proxy_response(upstream_response: reqwest::Response) -> Response {
    let status = upstream_response.status();
    let headers = upstream_response.headers().clone();
    let body = match upstream_response.bytes().await {
        Ok(bytes) => Body::from(bytes),
        Err(error) => {
            return (
                StatusCode::BAD_GATEWAY,
                format!("failed to read frontend dev server response: {error}"),
            )
                .into_response();
        }
    };

    let mut response = (status, body).into_response();
    copy_response_headers(&headers, response.headers_mut());
    response
}

fn copy_response_headers(source: &HeaderMap, target: &mut HeaderMap) {
    for (name, value) in source {
        if name.as_str().eq_ignore_ascii_case("content-length") {
            continue;
        }

        target.insert(name, value.clone());
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
