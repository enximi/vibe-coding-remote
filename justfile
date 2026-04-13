set shell := ["pwsh.exe", "-NoLogo", "-Command"]

# Start the web shell in a separate PowerShell window, then run the desktop server in dev mode.
dev:
    Start-Process pwsh -ArgumentList '-NoLogo', '-NoExit', '-Command', 'Set-Location {{invocation_directory()}}; bun run dev:web'
    bun run dev:server

# Run the Tauri desktop shell in development mode.
dev-tauri:
    bun run dev:tauri

# Build the web bundle first, then build the standalone Rust desktop server.
build:
    bun run build:server

# Build the packaged Tauri application.
build-tauri:
    bun run build:tauri
