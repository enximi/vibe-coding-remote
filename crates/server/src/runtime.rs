use crate::cli::{CliOptions, parse_cli_options};
use config::{Config, Environment, File, FileFormat};
use serde::Deserialize;
use std::{
    net::{IpAddr, Ipv4Addr},
    path::PathBuf,
};

const DEFAULT_CONFIG_PATH: &str = "config.toml";
const DEFAULT_HOST: IpAddr = IpAddr::V4(Ipv4Addr::LOCALHOST);
const DEFAULT_PORT: u16 = 8765;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RuntimeOptions {
    pub host: IpAddr,
    pub port: u16,
    pub auth_token: String,
}

#[derive(Debug, Clone, Deserialize)]
struct BaseConfig {
    host: IpAddr,
    port: u16,
    auth_token: Option<String>,
}

pub fn parse_runtime_options() -> Result<RuntimeOptions, String> {
    let cli = parse_cli_options();
    load_runtime_options(cli)
}

fn load_runtime_options(cli: CliOptions) -> Result<RuntimeOptions, String> {
    let base_config = load_base_config(&cli)?;
    build_runtime_options(cli, base_config)
}

fn load_base_config(cli: &CliOptions) -> Result<BaseConfig, String> {
    let config_path = cli
        .config
        .clone()
        .unwrap_or_else(|| PathBuf::from(DEFAULT_CONFIG_PATH));
    let required = cli.config.is_some();
    let config_path = config_path
        .to_str()
        .ok_or_else(|| format!("config path is not valid UTF-8: {}", config_path.display()))?;

    Config::builder()
        .set_default("host", DEFAULT_HOST.to_string())
        .map_err(|error| format!("failed to set default host: {error}"))?
        .set_default("port", DEFAULT_PORT)
        .map_err(|error| format!("failed to set default port: {error}"))?
        .add_source(File::new(config_path, FileFormat::Toml).required(required))
        .add_source(Environment::with_prefix("VOICE_BRIDGE"))
        .build()
        .map_err(|error| format!("failed to load runtime configuration: {error}"))?
        .try_deserialize()
        .map_err(|error| format!("failed to deserialize runtime configuration: {error}"))
}

fn build_runtime_options(
    cli: CliOptions,
    base_config: BaseConfig,
) -> Result<RuntimeOptions, String> {
    let auth_token = cli
        .auth_token
        .or(base_config.auth_token)
        .filter(|token| !token.trim().is_empty())
        .ok_or_else(|| missing_auth_token_error().to_owned())?;

    Ok(RuntimeOptions {
        host: cli.host.unwrap_or(base_config.host),
        port: cli.port.unwrap_or(base_config.port),
        auth_token,
    })
}

fn missing_auth_token_error() -> &'static str {
    "missing required auth token; set it with --auth-token, VOICE_BRIDGE_AUTH_TOKEN, or config.toml"
}
