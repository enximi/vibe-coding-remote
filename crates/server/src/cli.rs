use clap::{Args, Parser, Subcommand};
use std::{net::IpAddr, path::PathBuf};

#[derive(Debug, Clone, Parser)]
#[command(
    name = "vibe-coding-remote",
    about = "Run the local Vibe Coding Remote API server on your computer."
)]
pub(crate) struct Cli {
    #[command(subcommand)]
    pub command: CliCommand,
}

#[derive(Debug, Clone, Subcommand)]
pub(crate) enum CliCommand {
    Serve(ServeCliOptions),
    ExportTypes(ExportTypesCliOptions),
}

#[derive(Debug, Clone, Args)]
pub(crate) struct ServeCliOptions {
    #[arg(long, help = "Path to a TOML config file")]
    pub config: Option<PathBuf>,

    #[arg(long, help = "IP address to bind the local API server to")]
    pub host: Option<IpAddr>,

    #[arg(long, help = "TCP port to listen on")]
    pub port: Option<u16>,

    #[arg(long, help = "Bearer token required by protected API endpoints")]
    pub auth_token: Option<String>,
}

#[derive(Debug, Clone, Args)]
pub(crate) struct ExportTypesCliOptions {
    #[arg(long, help = "Output path for exported TypeScript types")]
    pub output: Option<PathBuf>,
}

pub(crate) fn parse_cli() -> Cli {
    Cli::parse()
}
