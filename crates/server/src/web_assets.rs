use crate::FrontendMode;
use axum::{
    Router,
    http::{
        HeaderValue, StatusCode, Uri,
        header::{self, HeaderName},
    },
    response::{IntoResponse, Response},
};
use mime_guess::from_path;
use rust_embed::{EmbeddedFile, RustEmbed};

#[derive(RustEmbed)]
#[folder = "../../apps/web/dist/"]
struct FrontendAssets;

const INDEX_FILE: &str = "index.html";
const CACHE_CONTROL_HEADER: HeaderName = header::CACHE_CONTROL;
const DEFAULT_CONTENT_TYPE: &str = "application/octet-stream";
const HTML_CONTENT_TYPE: &str = "text/html; charset=utf-8";

pub fn install(router: Router, frontend_mode: FrontendMode) -> Router {
    match frontend_mode {
        FrontendMode::Dev => router.fallback(development_frontend_notice),
        FrontendMode::Embedded => router.fallback(serve_embedded_asset),
    }
}

async fn development_frontend_notice() -> impl IntoResponse {
    (
        StatusCode::NOT_FOUND,
        "Frontend mode is set to dev. Open the Vite dev server directly instead of this Rust server.",
    )
}

async fn serve_embedded_asset(uri: Uri) -> Response {
    let request_path = normalize_request_path(uri.path());

    find_embedded_file(&request_path)
        .map(|file| file_response(&request_path, file))
        .unwrap_or_else(|| missing_asset_response(&request_path))
}

fn normalize_request_path(path: &str) -> String {
    let trimmed = path.trim_start_matches('/');
    if trimmed.is_empty() {
        INDEX_FILE.to_owned()
    } else {
        trimmed.to_owned()
    }
}

fn find_embedded_file(path: &str) -> Option<EmbeddedFile> {
    FrontendAssets::get(path).or_else(|| spa_fallback_file(path))
}

fn spa_fallback_file(path: &str) -> Option<EmbeddedFile> {
    if looks_like_asset_path(path) {
        None
    } else {
        FrontendAssets::get(INDEX_FILE)
    }
}

fn looks_like_asset_path(path: &str) -> bool {
    path.rsplit_once('.').is_some()
}

fn file_response(path: &str, file: EmbeddedFile) -> Response {
    let content_type = content_type_for_path(path);
    let cache_control = cache_control_for_path(path);

    (
        [
            (header::CONTENT_TYPE, HeaderValue::from_static(content_type)),
            (
                CACHE_CONTROL_HEADER,
                HeaderValue::from_static(cache_control),
            ),
        ],
        file.data.into_owned(),
    )
        .into_response()
}

fn missing_asset_response(path: &str) -> Response {
    (
        StatusCode::NOT_FOUND,
        format!("embedded frontend asset not found: {path}"),
    )
        .into_response()
}

fn content_type_for_path(path: &str) -> &'static str {
    if path.ends_with(".html") {
        HTML_CONTENT_TYPE
    } else {
        from_path(path).first_raw().unwrap_or(DEFAULT_CONTENT_TYPE)
    }
}

fn cache_control_for_path(path: &str) -> &'static str {
    if path == INDEX_FILE {
        "no-cache"
    } else {
        "public, max-age=31536000, immutable"
    }
}
