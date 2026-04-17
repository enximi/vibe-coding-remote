use keyboard_types::Code;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ServerActionRequest {
    pub action: ServerAction,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum ServerAction {
    InputText { text: String },
    KeySequence { sequence: Vec<KeyChord> },
}

impl ServerAction {
    pub fn validate(self) -> Result<Self, ActionValidationError> {
        match &self {
            Self::InputText { text } if text.is_empty() => Err(ActionValidationError::EmptyText),
            Self::KeySequence { sequence } if sequence.is_empty() => {
                Err(ActionValidationError::EmptySequence)
            }
            Self::KeySequence { sequence }
                if sequence.iter().any(|chord| chord.keys.is_empty()) =>
            {
                Err(ActionValidationError::EmptyChord)
            }
            _ => Ok(self),
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct KeyChord {
    pub keys: Vec<Code>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ApiResponse {
    pub ok: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ImportPayload {
    #[serde(rename = "v")]
    pub version: u8,
    pub endpoint: String,
    pub token: String,
}

#[derive(Debug, Clone, Copy, Error)]
pub enum ActionValidationError {
    #[error("text cannot be empty")]
    EmptyText,
    #[error("sequence cannot be empty")]
    EmptySequence,
    #[error("chord keys cannot be empty")]
    EmptyChord,
}
