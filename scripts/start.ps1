$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

function Test-PortInUse {
    param([int]$Port)

    return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

if (Test-PortInUse -Port 8000) {
    Write-Host "Backend ya escuchando en 8000, se reutiliza."
}
else {
    Start-Process -FilePath "php" `
        -ArgumentList "artisan", "serve", "--host=127.0.0.1", "--port=8000" `
        -WorkingDirectory $backend `
        -WindowStyle Hidden
}

if (Test-PortInUse -Port 5173) {
    Write-Host "Frontend ya escuchando en 5173, se reutiliza."
}
else {
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c", "npm run dev -- --host localhost --port 5173" `
        -WorkingDirectory $frontend `
        -WindowStyle Hidden
}

Write-Host "LumaFlow Studio running"
Write-Host "Backend:  http://127.0.0.1:8000"
Write-Host "Frontend: http://localhost:5173"
