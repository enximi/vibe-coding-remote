use local_ip_address::list_afinet_netifas;
use std::{
    collections::HashSet,
    net::{IpAddr, Ipv4Addr},
};

#[derive(Debug, Clone)]
struct AddressCandidate {
    interface_name: String,
    ip: Ipv4Addr,
    score: i32,
}

pub fn log_access_urls(host: IpAddr, port: u16) -> Option<String> {
    tracing::info!(bind = %format!("{host}:{port}"), "server bind address");

    if host.is_loopback() {
        let local_url = format!("http://127.0.0.1:{port}");
        tracing::info!(url = %local_url, "local access URL");
        tracing::info!("LAN access disabled because the server is bound to a loopback address");
        return Some(local_url);
    }

    if !host.is_unspecified() {
        let direct_url = format_url(host, port);
        tracing::info!(url = %direct_url, "direct access URL");
        return Some(direct_url);
    }

    tracing::info!(url = %format!("http://127.0.0.1:{port}"), "local access URL");

    let candidates = collect_address_candidates();
    let recommended_url = candidates
        .first()
        .map(|candidate| format_url(IpAddr::V4(candidate.ip), port));

    if let Some(recommended) = candidates.first() {
        tracing::info!(
            url = %format!("http://{}:{port}", recommended.ip),
            interface = %recommended.interface_name,
            "recommended LAN access URL"
        );
    } else {
        tracing::warn!("no private LAN IPv4 address found for recommended access URL");
    }

    let others = candidates.iter().skip(1).collect::<Vec<_>>();
    for candidate in others {
        tracing::info!(
            url = %format!("http://{}:{port}", candidate.ip),
            interface = %candidate.interface_name,
            "alternative LAN access URL"
        );
    }

    recommended_url
}

fn format_url(host: IpAddr, port: u16) -> String {
    match host {
        IpAddr::V4(ipv4) => format!("http://{ipv4}:{port}"),
        IpAddr::V6(ipv6) => format!("http://[{ipv6}]:{port}"),
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
