set shell := ["pwsh.exe", "-NoLogo", "-Command"]

# Start the frontend dev server in a separate PowerShell window,
# then run the Rust server in dev frontend mode in the current shell.
dev:
    Start-Process pwsh -ArgumentList '-NoLogo', '-NoExit', '-Command', 'Set-Location frontend; bun run dev -- --host'
    cargo run -- --frontend-mode dev

# Build the frontend bundle first, then build the Rust release executable.
build-release:
    cd frontend; bun run build
    cargo build --release
