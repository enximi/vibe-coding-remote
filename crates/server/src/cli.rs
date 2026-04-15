use clap::Parser;
use std::{net::IpAddr, path::PathBuf};

#[derive(Debug, Clone, Parser)]
#[command(
    name = "voice-bridge",
    about = "Run the local Voice Bridge API server on your computer."
)]
pub(crate) struct CliOptions {
    #[arg(long, help = "Path to a TOML config file")]
    pub config: Option<PathBuf>,

    #[arg(long, help = "IP address to bind the local API server to")]
    pub host: Option<IpAddr>,

    #[arg(long, help = "TCP port to listen on")]
    pub port: Option<u16>,

    #[arg(long, help = "Bearer token required by protected API endpoints")]
    pub auth_token: Option<String>,
}

pub(crate) fn parse_cli_options() -> CliOptions {
    CliOptions::parse()
}
