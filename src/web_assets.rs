use std::path::PathBuf;

const FRONTEND_DIR: &str = "frontend";
const FRONTEND_DIST_DIR: &str = "dist";
const FRONTEND_INDEX_FILE: &str = "index.html";

pub fn frontend_dist_dir() -> PathBuf {
    project_root().join(FRONTEND_DIR).join(FRONTEND_DIST_DIR)
}

pub fn frontend_index_file() -> PathBuf {
    frontend_dist_dir().join(FRONTEND_INDEX_FILE)
}

fn project_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}
