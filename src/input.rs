use arboard::Clipboard;
use std::{thread, time::Duration};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    INPUT, INPUT_0, INPUT_KEYBOARD, KEYBD_EVENT_FLAGS, KEYBDINPUT, KEYEVENTF_KEYUP, SendInput,
    VIRTUAL_KEY, VK_BACK, VK_CONTROL, VK_RETURN, VK_TAB, VK_V,
};

pub fn type_text(text: &str) -> Result<(), InputError> {
    let mut clipboard = Clipboard::new().map_err(InputError::ClipboardUnavailable)?;
    clipboard
        .set_text(text)
        .map_err(InputError::ClipboardWriteFailed)?;

    thread::sleep(Duration::from_millis(20));
    send_ctrl_v().map_err(InputError::SendInputFailed)?;

    Ok(())
}

pub fn press_key(key: PressKey) -> Result<(), InputError> {
    send_key(key.virtual_key()).map_err(InputError::SendInputFailed)
}

fn send_ctrl_v() -> windows::core::Result<()> {
    send_inputs(&[
        keyboard_input(VK_CONTROL, KEYBD_EVENT_FLAGS(0)),
        keyboard_input(VK_V, KEYBD_EVENT_FLAGS(0)),
        keyboard_input(VK_V, KEYEVENTF_KEYUP),
        keyboard_input(VK_CONTROL, KEYEVENTF_KEYUP),
    ])
}

fn send_key(key: VIRTUAL_KEY) -> windows::core::Result<()> {
    send_inputs(&[
        keyboard_input(key, KEYBD_EVENT_FLAGS(0)),
        keyboard_input(key, KEYEVENTF_KEYUP),
    ])
}

fn send_inputs(inputs: &[INPUT]) -> windows::core::Result<()> {
    let sent = unsafe {
        SendInput(
            inputs,
            std::mem::size_of::<INPUT>()
                .try_into()
                .expect("INPUT size should fit into i32"),
        )
    };

    if sent as usize != inputs.len() {
        return Err(windows::core::Error::from_thread());
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

#[derive(Debug, Clone, Copy)]
pub enum PressKey {
    Enter,
    Tab,
    Backspace,
}

impl PressKey {
    fn virtual_key(self) -> VIRTUAL_KEY {
        match self {
            Self::Enter => VK_RETURN,
            Self::Tab => VK_TAB,
            Self::Backspace => VK_BACK,
        }
    }
}

#[derive(Debug)]
pub enum InputError {
    ClipboardUnavailable(arboard::Error),
    ClipboardWriteFailed(arboard::Error),
    SendInputFailed(windows::core::Error),
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
        }
    }
}

impl std::error::Error for InputError {}
