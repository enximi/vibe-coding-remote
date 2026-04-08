use arboard::Clipboard;
use std::{thread, time::Duration};
use windows::Win32::UI::Input::KeyboardAndMouse::{
    INPUT, INPUT_0, INPUT_KEYBOARD, KEYBD_EVENT_FLAGS, KEYBDINPUT, KEYEVENTF_KEYUP, SendInput,
    VIRTUAL_KEY, VK_CONTROL, VK_V,
};

pub fn type_text(text: &str) -> Result<(), InputError> {
    let mut clipboard = Clipboard::new().map_err(InputError::ClipboardUnavailable)?;
    clipboard
        .set_text(text)
        .map_err(InputError::ClipboardWriteFailed)?;

    thread::sleep(Duration::from_millis(20));
    send_ctrl_v().map_err(InputError::PasteShortcutFailed)?;

    Ok(())
}

fn send_ctrl_v() -> windows::core::Result<()> {
    let inputs = [
        keyboard_input(VK_CONTROL, KEYBD_EVENT_FLAGS(0)),
        keyboard_input(VK_V, KEYBD_EVENT_FLAGS(0)),
        keyboard_input(VK_V, KEYEVENTF_KEYUP),
        keyboard_input(VK_CONTROL, KEYEVENTF_KEYUP),
    ];

    let sent = unsafe {
        SendInput(
            &inputs,
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

#[derive(Debug)]
pub enum InputError {
    ClipboardUnavailable(arboard::Error),
    ClipboardWriteFailed(arboard::Error),
    PasteShortcutFailed(windows::core::Error),
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
            Self::PasteShortcutFailed(error) => {
                write!(f, "failed to send Ctrl+V shortcut: {error}")
            }
        }
    }
}

impl std::error::Error for InputError {}
