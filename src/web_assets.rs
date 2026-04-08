use axum::{
    http::{HeaderValue, header},
    response::{Html, IntoResponse, Response},
};

const INDEX_HTML: &str = include_str!("mobile-web/index.html");
const APP_JS: &str = include_str!("mobile-web/app.js");
const STYLES_CSS: &str = include_str!("mobile-web/styles.css");
const MANIFEST: &str = include_str!("mobile-web/manifest.webmanifest");

pub async fn index() -> Html<&'static str> {
    Html(INDEX_HTML)
}

pub async fn app_js() -> Response {
    text_response(APP_JS, "application/javascript; charset=utf-8")
}

pub async fn styles_css() -> Response {
    text_response(STYLES_CSS, "text/css; charset=utf-8")
}

pub async fn manifest() -> Response {
    text_response(MANIFEST, "application/manifest+json; charset=utf-8")
}

fn text_response(body: &'static str, content_type: &'static str) -> Response {
    (
        [(header::CONTENT_TYPE, HeaderValue::from_static(content_type))],
        body,
    )
        .into_response()
}
