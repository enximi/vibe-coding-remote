mod typescript;

use std::{
    fs,
    path::{Path, PathBuf},
};
use thiserror::Error;
use typescript::render_typescript_bindings;

#[derive(Debug, Error)]
pub enum ExportError {
    #[error("failed to resolve output directory for generated TypeScript bindings")]
    MissingOutputDirectory,
    #[error("failed to create output directory {path}: {source}")]
    CreateOutputDirectory {
        path: String,
        #[source]
        source: std::io::Error,
    },
    #[error("failed to write TypeScript bindings to {path}: {source}")]
    WriteOutput {
        path: String,
        #[source]
        source: std::io::Error,
    },
    #[error("failed to render TypeScript bindings: {0}")]
    Render(String),
}

pub fn export_typescript_bindings(output_path: Option<PathBuf>) -> Result<PathBuf, ExportError> {
    let output_path = output_path.unwrap_or_else(default_output_path);
    let output_dir = output_path
        .parent()
        .ok_or(ExportError::MissingOutputDirectory)?;

    fs::create_dir_all(output_dir).map_err(|source| ExportError::CreateOutputDirectory {
        path: output_dir.display().to_string(),
        source,
    })?;

    let bindings =
        render_typescript_bindings().map_err(|error| ExportError::Render(error.to_string()))?;

    fs::write(&output_path, bindings).map_err(|source| ExportError::WriteOutput {
        path: output_path.display().to_string(),
        source,
    })?;

    Ok(output_path)
}
fn default_output_path() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("packages")
        .join("shared")
        .join("src")
        .join("types")
        .join("server.ts")
}
