use crate::protocol::ImportPayload;
use thiserror::Error;
use url::Url;

const IMPORT_SCHEME_URL: &str = "vibecodingremote://import";
const IMPORT_PAYLOAD_VERSION: u8 = 1;

#[derive(Debug, Clone)]
pub struct ImportConfig {
    pub payload: ImportPayload,
    pub import_url: String,
}

#[derive(Debug, Error)]
pub enum ImportConfigError {
    #[error("failed to build import URL: {0}")]
    BuildUrl(#[source] url::ParseError),
}

impl ImportConfig {
    pub fn new(endpoint: String, token: String) -> Result<Self, ImportConfigError> {
        let payload = ImportPayload {
            version: IMPORT_PAYLOAD_VERSION,
            endpoint,
            token,
        };
        let import_url = build_import_url(&payload)?;

        Ok(Self {
            payload,
            import_url,
        })
    }
}

fn build_import_url(payload: &ImportPayload) -> Result<String, ImportConfigError> {
    let mut url = Url::parse(IMPORT_SCHEME_URL).map_err(ImportConfigError::BuildUrl)?;
    url.query_pairs_mut()
        .append_pair("v", &payload.version.to_string())
        .append_pair("endpoint", &payload.endpoint)
        .append_pair("token", &payload.token);

    Ok(url.to_string())
}
