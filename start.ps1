# CortexOps AI — clean start (backend + frontend)
$Root = $PSScriptRoot

function Stop-Port($Port) {
  Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue |
    ForEach-Object {
      Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "`n=== CortexOps AI — Clean Start ===" -ForegroundColor Cyan

Stop-Port 3000
Stop-Port 3001
Start-Sleep -Seconds 1

if (Test-Path "$Root\frontend\.next") {
  Write-Host "Clearing frontend cache..." -ForegroundColor Gray
  Remove-Item -Recurse -Force "$Root\frontend\.next" -ErrorAction SilentlyContinue
}

Write-Host "Starting backend  -> http://127.0.0.1:8000" -ForegroundColor Gray
Start-Process powershell -ArgumentList @(
  '-NoExit', '-Command',
  "cd '$Root\backend'; python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000"
)

Start-Sleep -Seconds 3

Write-Host "Starting frontend -> http://localhost:3000" -ForegroundColor Gray
Start-Process powershell -ArgumentList @(
  '-NoExit', '-Command',
  "cd '$Root\frontend'; npm run dev"
)

Start-Sleep -Seconds 6

try {
  $h = Invoke-RestMethod "http://127.0.0.1:8000/health" -TimeoutSec 5
  Write-Host "Backend:  $($h.status)" -ForegroundColor Green
} catch {
  Write-Host "Backend:  still starting..." -ForegroundColor Yellow
}

try {
  $p = Invoke-WebRequest "http://localhost:3000/backend/health" -UseBasicParsing -TimeoutSec 15
  Write-Host "Frontend: OK (proxy $($p.StatusCode))" -ForegroundColor Green
} catch {
  Write-Host "Frontend: still compiling... open http://localhost:3000 in ~10s" -ForegroundColor Yellow
}

Write-Host "`nOpen: http://localhost:3000`n" -ForegroundColor Cyan
Start-Process "http://localhost:3000"
