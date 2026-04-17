mod clipboard;
mod executor;
mod keyboard;
mod keymap;
mod windows;

use keyboard_types::Code;
use thiserror::Error;

pub use executor::execute_action;
pub(crate) use keymap::supported_codes;

#[derive(Debug, Error)]
pub enum InputError {
    #[error("failed to open clipboard: {0}")]
    ClipboardUnavailable(arboard::Error),
    #[error("failed to write text to clipboard: {0}")]
    ClipboardWriteFailed(arboard::Error),
    #[error("keyboard code is not supported on this platform yet: {0}")]
    UnsupportedCode(Code),
    #[error("failed to send keyboard input: {0}")]
    SendInputFailed(String),
    #[cfg(not(target_os = "windows"))]
    #[error("desktop input injection is not implemented on this platform yet")]
    UnsupportedPlatform,
}
