use serde::{Deserialize, Serialize};
use specta::Type;
use thiserror::Error;

#[derive(Debug, Clone, Deserialize, Serialize, Type)]
pub struct ServerActionRequest {
    pub action: ServerAction,
}

#[derive(Debug, Clone, Deserialize, Serialize, Type)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum ServerAction {
    SendKey { key: ServerKeyName },
    SendShortcut { shortcut: ServerShortcut },
    PasteText { text: String },
}

impl ServerAction {
    pub fn validate(self) -> Result<Self, ActionValidationError> {
        match &self {
            Self::PasteText { text } if text.is_empty() => Err(ActionValidationError::EmptyText),
            _ => Ok(self),
        }
    }
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum ServerKeyName {
    Tab,
    Enter,
    Backspace,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, Type)]
#[serde(rename_all = "kebab-case")]
pub enum ServerShortcut {
    CtrlC,
    CtrlV,
    ShiftTab,
}

#[derive(Debug, Clone, Deserialize, Serialize, Type)]
pub struct ApiResponse {
    pub ok: bool,
}

#[derive(Debug, Clone, Copy, Error)]
pub enum ActionValidationError {
    #[error("text cannot be empty")]
    EmptyText,
}
