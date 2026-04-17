use crate::{
    input::{InputError, clipboard, keyboard},
    protocol::ServerAction,
};

pub fn execute_action(action: ServerAction) -> Result<(), InputError> {
    match action {
        ServerAction::InputText { text } => clipboard::input_text(&text),
        ServerAction::KeySequence { sequence } => keyboard::send_key_sequence(&sequence),
    }
}
