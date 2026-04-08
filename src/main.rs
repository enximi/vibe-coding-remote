mod input;

use axum::{
    Json, Router,
    extract::DefaultBodyLimit,
    http::{HeaderValue, StatusCode, header},
    response::{Html, IntoResponse, Response},
    routing::{get, post},
};
use local_ip_address::list_afinet_netifas;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    net::{IpAddr, Ipv4Addr, SocketAddr},
};

const INDEX_HTML: &str = include_str!("mobile-web/index.html");
const APP_JS: &str = include_str!("mobile-web/app.js");
const STYLES_CSS: &str = include_str!("mobile-web/styles.css");
const MANIFEST: &str = include_str!("mobile-web/manifest.webmanifest");

#[derive(Debug, Deserialize)]
struct TypeTextRequest {
    text: String,
}

#[derive(Debug, Serialize)]
struct ApiResponse {
    ok: bool,
}

#[derive(Debug, Clone)]
struct AddressCandidate {
    interface_name: String,
    ip: Ipv4Addr,
    score: i32,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/", get(index))
        .route("/app.js", get(app_js))
        .route("/styles.css", get(styles_css))
        .route("/manifest.webmanifest", get(manifest))
        .route("/api/type-text", post(type_text))
        .route("/health", get(health))
        .layer(DefaultBodyLimit::max(64 * 1024));

    let addr = SocketAddr::from(([0, 0, 0, 0], 8765));

    println!("VoiceBridge local server is starting...");
    print_access_urls(addr.port());
    println!(
        "RPC API:     http://127.0.0.1:{}/api/type-text",
        addr.port()
    );

    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("failed to bind TCP listener");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("server error");
}

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
    println!("\nVoiceBridge local server stopped.");
}

async fn index() -> Html<&'static str> {
    Html(INDEX_HTML)
}

async fn app_js() -> Response {
    text_response(APP_JS, "application/javascript; charset=utf-8")
}

async fn styles_css() -> Response {
    text_response(STYLES_CSS, "text/css; charset=utf-8")
}

async fn manifest() -> Response {
    text_response(MANIFEST, "application/manifest+json; charset=utf-8")
}

async fn health() -> &'static str {
    "ok"
}

async fn type_text(Json(payload): Json<TypeTextRequest>) -> Result<Json<ApiResponse>, AppError> {
    let text = payload.text.trim();
    if text.is_empty() {
        return Err(AppError::bad_request("text cannot be empty"));
    }

    input::type_text(text).map_err(AppError::type_text_failed)?;

    println!("\n--- type_text ---\ntext: {}\n-----------------", text);

    Ok(Json(ApiResponse { ok: true }))
}

fn print_access_urls(port: u16) {
    println!("Local:       http://127.0.0.1:{port}");

    let candidates = collect_address_candidates();

    if let Some(recommended) = candidates.first() {
        println!(
            "Recommended: http://{}:{port}  ({})",
            recommended.ip, recommended.interface_name
        );
    } else {
        println!("Recommended: no private LAN IPv4 address found");
    }

    let others = candidates.iter().skip(1).collect::<Vec<_>>();
    if !others.is_empty() {
        println!("Other IPv4:");
        for candidate in others {
            println!(
                "  - http://{}:{port}  ({})",
                candidate.ip, candidate.interface_name
            );
        }
    }
}

fn collect_address_candidates() -> Vec<AddressCandidate> {
    let mut seen = HashSet::new();
    let mut candidates = list_afinet_netifas()
        .map(|entries| {
            entries
                .into_iter()
                .filter_map(|(interface_name, ip)| match ip {
                    IpAddr::V4(ipv4) if is_viable_lan_ipv4(ipv4) => {
                        let key = (interface_name.clone(), ipv4);
                        if seen.insert(key) {
                            Some(AddressCandidate {
                                score: score_interface(&interface_name, ipv4),
                                interface_name,
                                ip: ipv4,
                            })
                        } else {
                            None
                        }
                    }
                    _ => None,
                })
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();

    candidates.sort_by(|left, right| {
        right
            .score
            .cmp(&left.score)
            .then_with(|| left.interface_name.cmp(&right.interface_name))
            .then_with(|| left.ip.octets().cmp(&right.ip.octets()))
    });

    candidates
}

fn is_viable_lan_ipv4(ip: Ipv4Addr) -> bool {
    ip.is_private() && !ip.is_loopback() && !ip.is_link_local()
}

fn score_interface(interface_name: &str, ip: Ipv4Addr) -> i32 {
    let name = interface_name.to_ascii_lowercase();
    let mut score = 0;

    if ip.is_private() {
        score += 100;
    }

    for good_hint in [
        "wi-fi",
        "wifi",
        "wlan",
        "wireless",
        "ethernet",
        "lan",
        "以太网",
    ] {
        if name.contains(good_hint) {
            score += 40;
        }
    }

    for bad_hint in [
        "clash",
        "docker",
        "hyper-v",
        "vethernet",
        "virtual",
        "vmware",
        "vbox",
        "tailscale",
        "zerotier",
        "loopback",
        "bluetooth",
        "vpn",
        "tun",
        "tap",
        "wsl",
    ] {
        if name.contains(bad_hint) {
            score -= 120;
        }
    }

    score
}

fn text_response(body: &'static str, content_type: &'static str) -> Response {
    (
        [(header::CONTENT_TYPE, HeaderValue::from_static(content_type))],
        body,
    )
        .into_response()
}

struct AppError {
    status: StatusCode,
    message: String,
}

impl AppError {
    fn bad_request(message: impl Into<String>) -> Self {
        Self {
            status: StatusCode::BAD_REQUEST,
            message: message.into(),
        }
    }

    fn type_text_failed(error: input::InputError) -> Self {
        Self {
            status: StatusCode::INTERNAL_SERVER_ERROR,
            message: error.to_string(),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        (self.status, self.message).into_response()
    }
}
