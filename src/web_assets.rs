#[cfg(not(debug_assertions))]
use axum::http::Uri;
use axum::{Router, http::StatusCode, response::IntoResponse};

pub fn install(router: Router) -> Router {
    #[cfg(debug_assertions)]
    {
        router.fallback(development_frontend_notice)
    }

    #[cfg(not(debug_assertions))]
    {
        router.fallback(serve_embedded_asset)
    }
}

#[cfg(debug_assertions)]
async fn development_frontend_notice() -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        "Frontend is served by the Vite dev server during development. Open the Vite URL directly.",
    )
}

#[cfg(not(debug_assertions))]
use axum::{
    http::{
        HeaderValue,
        header::{self, HeaderName},
    },
    response::Response,
};
#[cfg(not(debug_assertions))]
use include_dir::{Dir, File, include_dir};

#[cfg(not(debug_assertions))]
static FRONTEND_DIST: Dir<'_> = include_dir!("$CARGO_MANIFEST_DIR/frontend/dist");

#[cfg(not(debug_assertions))]
const INDEX_FILE: &str = "index.html";
#[cfg(not(debug_assertions))]
const CACHE_CONTROL_HEADER: HeaderName = header::CACHE_CONTROL;

#[cfg(not(debug_assertions))]
async fn serve_embedded_asset(uri: Uri) -> Response {
    let request_path = normalize_request_path(uri.path());

    find_embedded_file(&request_path)
        .map(file_response)
        .unwrap_or_else(|| missing_asset_response(&request_path))
}

#[cfg(not(debug_assertions))]
fn normalize_request_path(path: &str) -> String {
    let trimmed = path.trim_start_matches('/');
    if trimmed.is_empty() {
        INDEX_FILE.to_owned()
    } else {
        trimmed.to_owned()
    }
}

#[cfg(not(debug_assertions))]
fn find_embedded_file(path: &str) -> Option<File<'static>> {
    FRONTEND_DIST
        .get_file(path)
        .cloned()
        .or_else(|| spa_fallback_file(path))
}

#[cfg(not(debug_assertions))]
fn spa_fallback_file(path: &str) -> Option<File<'static>> {
    if looks_like_asset_path(path) {
        None
    } else {
        FRONTEND_DIST.get_file(INDEX_FILE).cloned()
    }
}

#[cfg(not(debug_assertions))]
fn looks_like_asset_path(path: &str) -> bool {
    path.rsplit_once('.').is_some()
}

#[cfg(not(debug_assertions))]
fn file_response(file: File<'static>) -> Response {
    let path = file.path().to_string_lossy();
    let content_type = content_type_for_path(&path);
    let cache_control = cache_control_for_path(&path);

    (
        [
            (header::CONTENT_TYPE, HeaderValue::from_static(content_type)),
            (
                CACHE_CONTROL_HEADER,
                HeaderValue::from_static(cache_control),
            ),
        ],
        file.contents().to_owned(),
    )
        .into_response()
}

#[cfg(not(debug_assertions))]
fn missing_asset_response(path: &str) -> Response {
    (
        StatusCode::NOT_FOUND,
        format!("embedded frontend asset not found: {path}"),
    )
        .into_response()
}

#[cfg(not(debug_assertions))]
fn content_type_for_path(path: &str) -> &'static str {
    match path.rsplit_once('.').map(|(_, extension)| extension) {
        Some("html") => "text/html; charset=utf-8",
        Some("css") => "text/css; charset=utf-8",
        Some("js") => "text/javascript; charset=utf-8",
        Some("svg") => "image/svg+xml",
        Some("json") => "application/json; charset=utf-8",
        Some("webmanifest") => "application/manifest+json; charset=utf-8",
        Some("txt") => "text/plain; charset=utf-8",
        Some("ico") => "image/x-icon",
        Some("png") => "image/png",
        Some("jpg" | "jpeg") => "image/jpeg",
        Some("webp") => "image/webp",
        Some("woff") => "font/woff",
        Some("woff2") => "font/woff2",
        _ => "application/octet-stream",
    }
}

#[cfg(not(debug_assertions))]
fn cache_control_for_path(path: &str) -> &'static str {
    if path == INDEX_FILE {
        "no-cache"
    } else {
        "public, max-age=31536000, immutable"
    }
}
