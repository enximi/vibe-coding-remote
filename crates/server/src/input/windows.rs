use crate::input::{InputError, keymap::MappedKey};

#[cfg(target_os = "windows")]
use windows::Win32::UI::Input::KeyboardAndMouse::{
    INPUT, INPUT_0, INPUT_KEYBOARD, KEYBD_EVENT_FLAGS, KEYBDINPUT, KEYEVENTF_EXTENDEDKEY,
    KEYEVENTF_KEYUP, SendInput, VIRTUAL_KEY,
};

#[cfg(target_os = "windows")]
pub(super) fn send_key_chord(keys: &[MappedKey]) -> Result<(), InputError> {
    let mut inputs = Vec::with_capacity(keys.len() * 2);

    for key in keys {
        inputs.push(keyboard_input(key, false));
    }

    for key in keys.iter().rev() {
        inputs.push(keyboard_input(key, true));
    }

    send_inputs(&inputs)
}

#[cfg(target_os = "windows")]
fn keyboard_input(key: &MappedKey, key_up: bool) -> INPUT {
    let mut flags = KEYBD_EVENT_FLAGS(0);
    if key.extended {
        flags |= KEYEVENTF_EXTENDEDKEY;
    }
    if key_up {
        flags |= KEYEVENTF_KEYUP;
    }

    INPUT {
        r#type: INPUT_KEYBOARD,
        Anonymous: INPUT_0 {
            ki: KEYBDINPUT {
                wVk: VIRTUAL_KEY(key.virtual_key),
                wScan: 0,
                dwFlags: flags,
                time: 0,
                dwExtraInfo: 0,
            },
        },
    }
}

#[cfg(target_os = "windows")]
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

#[cfg(not(target_os = "windows"))]
pub(super) fn send_key_chord(_keys: &[MappedKey]) -> Result<(), InputError> {
    Err(InputError::UnsupportedPlatform)
}
