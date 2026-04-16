set windows-shell := ["pwsh.exe", "-NoLogo", "-Command"]

# Start the LAN server in a new PowerShell window, then run the web dev server here.
dev-web-lan:
    Start-Process pwsh -WorkingDirectory '{{justfile_directory()}}' -ArgumentList '-NoLogo', '-Command', 'pnpm run dev:server -- --host 0.0.0.0 --auth-token dev-token'
    pnpm run dev:web
