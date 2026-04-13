use clap::{Parser, ValueEnum};

#[derive(Debug, Clone, Copy, PartialEq, Eq, ValueEnum)]
pub enum FrontendMode {
    Dev,
    Embedded,
}

#[derive(Debug, Clone, Copy, Parser)]
#[command(
    name = "voice-bridge",
    about = "Use your phone's input method and voice dictation to type into the focused window on your Windows PC."
)]
pub struct RuntimeOptions {
    #[arg(
        long,
        value_enum,
        default_value_t = FrontendMode::Embedded,
        help = "Select how the frontend is served"
    )]
    pub frontend_mode: FrontendMode,
}

pub fn parse_runtime_options() -> RuntimeOptions {
    RuntimeOptions::parse()
}

#[cfg(test)]
mod tests {
    use super::{FrontendMode, RuntimeOptions};
    use clap::Parser;

    #[test]
    fn defaults_to_embedded_frontend_mode() {
        let options = RuntimeOptions::parse_from(["voice-bridge"]);
        assert_eq!(options.frontend_mode, FrontendMode::Embedded);
    }

    #[test]
    fn parses_explicit_dev_frontend_mode() {
        let options = RuntimeOptions::parse_from(["voice-bridge", "--frontend-mode", "dev"]);
        assert_eq!(options.frontend_mode, FrontendMode::Dev);
    }
}
