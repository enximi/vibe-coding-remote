use std::path::PathBuf;

pub fn frontend_dist_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("frontend")
        .join("dist")
}

pub fn frontend_index_file() -> PathBuf {
    frontend_dist_dir().join("index.html")
}
