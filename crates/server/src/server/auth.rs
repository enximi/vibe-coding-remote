use crate::server::error::AppError;
use axum::http::{HeaderMap, header};

pub(super) fn authorize(headers: &HeaderMap, expected_token: &str) -> Result<(), AppError> {
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
