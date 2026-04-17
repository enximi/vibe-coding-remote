use crate::server::{AppState, handlers};
use axum::{
    Router,
    extract::DefaultBodyLimit,
    routing::{get, post},
};
use std::sync::Arc;
use tower_http::cors::CorsLayer;

const MAX_REQUEST_BODY_BYTES: usize = 64 * 1024;

pub(super) fn build_router(auth_token: String) -> Router {
    Router::new()
        .route("/api/action", post(handlers::execute_action))
        .route("/api/auth-check", get(handlers::auth_check))
        .route("/api/capabilities", get(handlers::capabilities))
        .route("/health", get(handlers::health))
        .layer(CorsLayer::permissive())
        .layer(DefaultBodyLimit::max(MAX_REQUEST_BODY_BYTES))
        .with_state(AppState {
            auth_token: Arc::<str>::from(auth_token),
        })
}
