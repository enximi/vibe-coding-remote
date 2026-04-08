use arboard::Clipboard;
use std::{thread, time::Duration};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    INPUT, INPUT_0, INPUT_KEYBOARD, KEYBD_EVENT_FLAGS, KEYBDINPUT, KEYEVENTF_KEYUP, SendInput,
    VIRTUAL_KEY, VK_BACK, VK_C, VK_CONTROL, VK_RETURN, VK_TAB, VK_V,
};

const CLIPBOARD_SETTLE_DELAY_MS: u64 = 20;

pub fn type_text(text: &str) -> Result<(), InputError> {
    paste_text(text)
}

pub fn perform_action(action: InputAction) -> Result<(), InputError> {
    match action {
        InputAction::Enter => send_key(VK_RETURN),
        InputAction::Tab => send_key(VK_TAB),
        InputAction::Backspace => send_key(VK_BACK),
        InputAction::Copy => send_ctrl_shortcut(VK_C),
        InputAction::Paste => send_ctrl_shortcut(VK_V),
        InputAction::Newline => return paste_text("\n"),
    }
    .map_err(InputError::SendInputFailed)
}

fn paste_text(text: &str) -> Result<(), InputError> {
    let mut clipboard = Clipboard::new().map_err(InputError::ClipboardUnavailable)?;
    clipboard
        .set_text(text)
        .map_err(InputError::ClipboardWriteFailed)?;

    thread::sleep(Duration::from_millis(CLIPBOARD_SETTLE_DELAY_MS));
    send_ctrl_shortcut(VK_V).map_err(InputError::SendInputFailed)?;

    Ok(())
}

fn send_ctrl_shortcut(key: VIRTUAL_KEY) -> windows::core::Result<()> {
    send_inputs(&[
        keyboard_input(VK_CONTROL, KEYBD_EVENT_FLAGS(0)),
        keyboard_input(key, KEYBD_EVENT_FLAGS(0)),
        keyboard_input(key, KEYEVENTF_KEYUP),
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
