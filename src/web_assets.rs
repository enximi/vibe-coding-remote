use std::path::PathBuf;

const FRONTEND_DIR: &str = "frontend";
const FRONTEND_DIST_DIR: &str = "dist";
const FRONTEND_INDEX_FILE: &str = "index.html";

pub fn frontend_dist_dir() -> PathBuf {
    existing_frontend_dist_dir().unwrap_or_else(default_frontend_dist_dir)
}

pub fn frontend_index_file() -> PathBuf {
    frontend_dist_dir().join(FRONTEND_INDEX_FILE)
}

fn existing_frontend_dist_dir() -> Option<PathBuf> {
    frontend_dist_candidates()
        .into_iter()
        .find(|path| path.join(FRONTEND_INDEX_FILE).is_file())
}

fn frontend_dist_candidates() -> Vec<PathBuf> {
    let mut candidates = Vec::new();

    if let Ok(executable_path) = std::env::current_exe() {
        if let Some(executable_dir) = executable_path.parent() {
            candidates.push(executable_dir.join(FRONTEND_DIST_DIR));
            candidates.push(executable_dir.join(FRONTEND_DIR).join(FRONTEND_DIST_DIR));
        }
    }

    candidates.push(default_frontend_dist_dir());
    candidates
}

fn default_frontend_dist_dir() -> PathBuf {
    project_root().join(FRONTEND_DIR).join(FRONTEND_DIST_DIR)
}

fn project_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
}
