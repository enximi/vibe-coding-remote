use arboard::Clipboard;
use std::{thread, time::Duration};

const CLIPBOARD_SETTLE_DELAY_MS: u64 = 20;

#[derive(Debug, Clone, Copy)]
pub enum InputAction {
    Enter,
    Tab,
    Backspace,
    Copy,
    Paste,
    Newline,
}

#[derive(Debug)]
pub enum InputError {
    ClipboardUnavailable(arboard::Error),
    ClipboardWriteFailed(arboard::Error),
    SendInputFailed(String),
    #[cfg(not(target_os = "windows"))]
    UnsupportedPlatform,
}

pub fn type_text(text: &str) -> Result<(), InputError> {
    paste_text(text)
}

pub fn perform_action(action: InputAction) -> Result<(), InputError> {
    match action {
        InputAction::Enter => send_enter(),
        InputAction::Tab => send_tab(),
        InputAction::Backspace => send_backspace(),
        InputAction::Copy => send_copy(),
        InputAction::Paste => send_paste(),
        InputAction::Newline => paste_text("\n"),
    }
}

fn paste_text(text: &str) -> Result<(), InputError> {
    let mut clipboard = Clipboard::new().map_err(InputError::ClipboardUnavailable)?;
    clipboard
        .set_text(text)
        .map_err(InputError::ClipboardWriteFailed)?;

    thread::sleep(Duration::from_millis(CLIPBOARD_SETTLE_DELAY_MS));
    send_paste()
}

#[cfg(target_os = "windows")]
mod platform {
    use super::InputError;
    use windows::Win32::UI::Input::KeyboardAndMouse::{
        INPUT, INPUT_0, INPUT_KEYBOARD, KEYBD_EVENT_FLAGS, KEYBDINPUT, KEYEVENTF_KEYUP, SendInput,
        VIRTUAL_KEY, VK_BACK, VK_C, VK_CONTROL, VK_RETURN, VK_TAB, VK_V,
    };

    pub fn send_enter() -> Result<(), InputError> {
        send_key(VK_RETURN)
    }

    pub fn send_tab() -> Result<(), InputError> {
        send_key(VK_TAB)
    }

    pub fn send_backspace() -> Result<(), InputError> {
        send_key(VK_BACK)
    }

    pub fn send_copy() -> Result<(), InputError> {
        send_ctrl_shortcut(VK_C)
    }

    pub fn send_paste() -> Result<(), InputError> {
        send_ctrl_shortcut(VK_V)
    }

    fn send_ctrl_shortcut(key: VIRTUAL_KEY) -> Result<(), InputError> {
        send_inputs(&[
            keyboard_input(VK_CONTROL, KEYBD_EVENT_FLAGS(0)),
            keyboard_input(key, KEYBD_EVENT_FLAGS(0)),
            keyboard_input(key, KEYEVENTF_KEYUP),
            keyboard_input(VK_CONTROL, KEYEVENTF_KEYUP),
        ])
    }

    fn send_key(key: VIRTUAL_KEY) -> Result<(), InputError> {
        send_inputs(&[
            keyboard_input(key, KEYBD_EVENT_FLAGS(0)),
            keyboard_input(key, KEYEVENTF_KEYUP),
        ])
    }

    fn send_inputs(inputs: &[INPUT]) -> Result<(), InputError> {
        // SAFETY: `inputs` points to a valid slice of `INPUT` values that lives until the call returns,
        // and the element size matches the `INPUT` layout expected by Win32.
        let sent = unsafe {
            SendInput(
                inputs,
                std::mem::size_of::<INPUT>()
                    .try_into()
                    .expect("INPUT size should fit into i32"),
            )
        };

        if sent as usize != inputs.len() {
            return Err(InputError::SendInputFailed(
                windows::core::Error::from_thread().to_string(),
            ));
        }

        Ok(())
    }

    fn keyboard_input(key: VIRTUAL_KEY, flags: KEYBD_EVENT_FLAGS) -> INPUT {
        INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: key,
                    wScan: 0,
                    dwFlags: flags,
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        }
    }
}

#[cfg(not(target_os = "windows"))]
mod platform {
    use super::InputError;

    pub fn send_enter() -> Result<(), InputError> {
        Err(InputError::UnsupportedPlatform)
    }

    pub fn send_tab() -> Result<(), InputError> {
        Err(InputError::UnsupportedPlatform)
    }

    pub fn send_backspace() -> Result<(), InputError> {
        Err(InputError::UnsupportedPlatform)
    }

    pub fn send_copy() -> Result<(), InputError> {
        Err(InputError::UnsupportedPlatform)
    }

    pub fn send_paste() -> Result<(), InputError> {
        Err(InputError::UnsupportedPlatform)
    }
}

use platform::{send_backspace, send_copy, send_enter, send_paste, send_tab};

impl std::fmt::Display for InputError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::ClipboardUnavailable(error) => {
                write!(f, "failed to open clipboard: {error}")
            }
            Self::ClipboardWriteFailed(error) => {
                write!(f, "failed to write text to clipboard: {error}")
            }
            Self::SendInputFailed(error) => {
                write!(f, "failed to send keyboard input: {error}")
            }
            #[cfg(not(target_os = "windows"))]
            Self::UnsupportedPlatform => {
                write!(f, "desktop input injection is not implemented on this platform yet")
            }
        }
    }
}

impl std::error::Error for InputError {}
