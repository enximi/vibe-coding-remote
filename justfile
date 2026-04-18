set windows-shell := ["pwsh.exe", "-NoLogo", "-Command"]

dev-server:
    cargo run -p vibe-coding-remote-server -- serve

dev-server-lan:
    cargo run -p vibe-coding-remote-server -- serve --host 0.0.0.0 --auth-token dev-token

export-types:
    cargo run -p vibe-coding-remote-server -- export-types

build-server:
    cargo build -p vibe-coding-remote-server --release

# Start the LAN server in a new PowerShell window, then run the web dev server here.
dev-server-and-web:
    Start-Process pwsh -WorkingDirectory '{{justfile_directory()}}' -ArgumentList '-NoLogo', '-Command', 'just dev-server-lan'
    pnpm run dev:web
