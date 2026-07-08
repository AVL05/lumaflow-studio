$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

Start-Process -FilePath "php" `
    -ArgumentList "artisan", "serve", "--host=127.0.0.1", "--port=8000" `
    -WorkingDirectory $backend `
    -WindowStyle Hidden

Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run dev -- --host localhost --port 5173" `
    -WorkingDirectory $frontend `
    -WindowStyle Hidden

Write-Host "LumaFlow Studio running"
Write-Host "Backend:  http://127.0.0.1:8000"
Write-Host "Frontend: http://localhost:5173"
