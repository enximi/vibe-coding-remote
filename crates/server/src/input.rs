use crate::action::{Action, KeyName, Shortcut};
use arboard::Clipboard;
use std::{thread, time::Duration};

const CLIPBOARD_SETTLE_DELAY_MS: u64 = 20;

#[derive(Debug)]
pub enum InputError {
    ClipboardUnavailable(arboard::Error),
    ClipboardWriteFailed(arboard::Error),
    SendInputFailed(String),
    #[cfg(not(target_os = "windows"))]
    UnsupportedPlatform,
}

pub fn execute_action(action: Action) -> Result<(), InputError> {
    match action {
        Action::SendKey { key } => send_key(key),
        Action::SendShortcut { shortcut } => send_shortcut(shortcut),
        Action::PasteText { text } => paste_text(&text),
    }
}

fn paste_text(text: &str) -> Result<(), InputError> {
    let mut clipboard = Clipboard::new().map_err(InputError::ClipboardUnavailable)?;
    clipboard
        .set_text(text)
        .map_err(InputError::ClipboardWriteFailed)?;

    thread::sleep(Duration::from_millis(CLIPBOARD_SETTLE_DELAY_MS));
    send_shortcut(Shortcut::CtrlV)
}

fn send_key(key: KeyName) -> Result<(), InputError> {
    match key {
        KeyName::Tab => platform::send_tab(),
        KeyName::Enter => platform::send_enter(),
        KeyName::Backspace => platform::send_backspace(),
    }
}

fn send_shortcut(shortcut: Shortcut) -> Result<(), InputError> {
    match shortcut {
        Shortcut::CtrlC => platform::send_ctrl_c(),
        Shortcut::CtrlV => platform::send_ctrl_v(),
        Shortcut::ShiftTab => platform::send_shift_tab(),
    }
}

#[cfg(target_os = "windows")]
mod platform {
    use super::InputError;
    use windows::Win32::UI::Input::KeyboardAndMouse::{
        INPUT, INPUT_0, INPUT_KEYBOARD, KEYBD_EVENT_FLAGS, KEYBDINPUT, KEYEVENTF_KEYUP, SendInput,
        VIRTUAL_KEY, VK_BACK, VK_C, VK_CONTROL, VK_RETURN, VK_SHIFT, VK_TAB, VK_V,
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

    pub fn send_ctrl_c() -> Result<(), InputError> {
        send_shortcut(&[VK_CONTROL], VK_C)
    }

    pub fn send_ctrl_v() -> Result<(), InputError> {
        send_shortcut(&[VK_CONTROL], VK_V)
    }

    pub fn send_shift_tab() -> Result<(), InputError> {
        send_shortcut(&[VK_SHIFT], VK_TAB)
    }

    fn send_shortcut(modifiers: &[VIRTUAL_KEY], key: VIRTUAL_KEY) -> Result<(), InputError> {
        let mut inputs = Vec::with_capacity((modifiers.len() * 2) + 2);

        for &modifier in modifiers {
            inputs.push(keyboard_input(modifier, KEYBD_EVENT_FLAGS(0)));
        }

        inputs.push(keyboard_input(key, KEYBD_EVENT_FLAGS(0)));
        inputs.push(keyboard_input(key, KEYEVENTF_KEYUP));

        for &modifier in modifiers.iter().rev() {
            inputs.push(keyboard_input(modifier, KEYEVENTF_KEYUP));
        }

        send_inputs(&inputs)
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

    pub fn send_ctrl_c() -> Result<(), InputError> {
        Err(InputError::UnsupportedPlatform)
    }

    pub fn send_ctrl_v() -> Result<(), InputError> {
        Err(InputError::UnsupportedPlatform)
    }

    pub fn send_shift_tab() -> Result<(), InputError> {
        Err(InputError::UnsupportedPlatform)
    }
}

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
                write!(
                    f,
                    "desktop input injection is not implemented on this platform yet"
                )
            }
        }
    }
}

impl std::error::Error for InputError {}
