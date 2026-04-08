use std::{env, path::PathBuf};

const DEFAULT_FRONTEND_DEV_URL: &str = "http://127.0.0.1:5173";
const FRONTEND_DEV_URL_ENV: &str = "VOICE_BRIDGE_FRONTEND_DEV_URL";

pub fn frontend_dist_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("frontend")
        .join("dist")
}

pub fn frontend_index_file() -> PathBuf {
    frontend_dist_dir().join("index.html")
}

pub fn frontend_dev_server_url() -> Option<String> {
    match env::var(FRONTEND_DEV_URL_ENV) {
        Ok(url) => normalize_dev_server_url(url),
        Err(_) if cfg!(debug_assertions) => Some(DEFAULT_FRONTEND_DEV_URL.to_string()),
        Err(_) => None,
    }
}

fn normalize_dev_server_url(url: String) -> Option<String> {
    let trimmed = url.trim().trim_end_matches('/');
    if trimmed.is_empty() {
        return None;
    }

    Some(trimmed.to_string())
}
