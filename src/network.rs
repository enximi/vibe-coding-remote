use local_ip_address::list_afinet_netifas;
use qrcode::QrCode;
use std::{
    collections::HashSet,
    net::{IpAddr, Ipv4Addr},
};

const QR_DARK_MODULE: &str = "\x1b[40m  \x1b[0m";
const QR_LIGHT_MODULE: &str = "\x1b[47m  \x1b[0m";

#[derive(Debug, Clone)]
struct AddressCandidate {
    interface_name: String,
    ip: Ipv4Addr,
    score: i32,
}

pub fn print_access_urls(port: u16) -> Option<String> {
    println!("Local:       http://127.0.0.1:{port}");

    let candidates = collect_address_candidates();
    let recommended_url = candidates
        .first()
        .map(|candidate| format!("http://{}:{port}", candidate.ip));

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

    recommended_url
}

pub fn print_startup_qr(url: Option<&str>) {
    let Some(url) = url else {
        println!("QR Code:     skipped (no recommended LAN address)");
        return;
    };

    println!("Scan to open on phone:");

    match QrCode::new(url.as_bytes()) {
        Ok(code) => {
            let image = render_terminal_qr(&code);
            println!("{image}");
            println!("{url}");
        }
        Err(error) => {
            println!("QR Code:     failed to generate ({error})");
            println!("{url}");
        }
    }
}

fn render_terminal_qr(code: &QrCode) -> String {
    let qr = code
        .render::<&str>()
        .dark_color(QR_DARK_MODULE)
        .light_color(QR_LIGHT_MODULE)
        .quiet_zone(false)
        .build();

    let side_border = QR_LIGHT_MODULE;
    let border_line = QR_LIGHT_MODULE.repeat(code.width() + 2);
    let mut lines = Vec::with_capacity(code.width() + 2);
    lines.push(border_line.clone());

    for line in qr.lines() {
        lines.push(format!("{side_border}{line}{side_border}"));
    }

    lines.push(border_line);
    lines.join("\n")
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
