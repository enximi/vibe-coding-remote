use serde::Deserialize;

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

#[derive(Debug, Clone, Copy)]
pub enum ActionValidationError {
    EmptyText,
}

impl std::fmt::Display for ActionValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::EmptyText => write!(f, "text cannot be empty"),
        }
    }
}

impl std::error::Error for ActionValidationError {}
