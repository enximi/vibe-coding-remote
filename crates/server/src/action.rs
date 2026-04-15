use serde::Deserialize;
use thiserror::Error;

#[derive(Debug, Clone, Deserialize)]
pub struct ActionRequest {
    pub action: Action,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum Action {
    SendKey { key: KeyName },
    SendShortcut { shortcut: Shortcut },
    PasteText { text: String },
}

impl Action {
    pub fn validate(self) -> Result<Self, ActionValidationError> {
        match &self {
            Self::PasteText { text } if text.is_empty() => Err(ActionValidationError::EmptyText),
            _ => Ok(self),
        }
    }
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum KeyName {
    Tab,
    Enter,
    Backspace,
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Shortcut {
    CtrlC,
    CtrlV,
    ShiftTab,
}

#[derive(Debug, Clone, Copy, Error)]
pub enum ActionValidationError {
    #[error("text cannot be empty")]
    EmptyText,
}
