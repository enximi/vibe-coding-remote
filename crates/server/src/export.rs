use crate::protocol::{
    ApiResponse, ServerAction, ServerActionRequest, ServerKeyName, ServerShortcut,
};
use specta::Types;
use specta_serde::apply;
use specta_typescript::Typescript;
use std::{
    fs,
    path::{Path, PathBuf},
};
use thiserror::Error;

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
    #[error("failed to apply serde transformations for exported bindings: {0}")]
    ApplySerde(#[from] specta_serde::Error),
    #[error("failed to export TypeScript bindings: {0}")]
    ExportTypescript(#[from] specta_typescript::Error),
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

    let types = Types::default()
        .register::<ApiResponse>()
        .register::<ServerActionRequest>()
        .register::<ServerAction>()
        .register::<ServerKeyName>()
        .register::<ServerShortcut>();
    let resolved_types = apply(types)?;

    Typescript::default().export_to(&output_path, &resolved_types)?;

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
