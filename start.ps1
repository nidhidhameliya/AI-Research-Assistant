# AI Research Assistant — One-click Windows launcher
# Usage: .\start.ps1

$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "AI Research Assistant v2"

Write-Host ""
Write-Host "Starting AI Research Assistant v2.0" -ForegroundColor Cyan
Write-Host ""

$ROOT = $PSScriptRoot
$BACKEND = Join-Path $ROOT "backend"
$FRONTEND = Join-Path $ROOT "frontend"
$VENV_PYTHON = Join-Path $BACKEND ".venv\Scripts\python.exe"

if (-not (Test-Path (Join-Path $BACKEND ".env")) -and -not (Test-Path (Join-Path $ROOT ".env"))) {
    Copy-Item (Join-Path $ROOT ".env.example") (Join-Path $BACKEND ".env")
    Write-Host "[WARN] Copied .env.example to backend\.env — set GROQ_API_KEY for chat." -ForegroundColor Yellow
}

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw "Python 3.11+ is required but was not found on PATH."
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "Node.js 18+ is required but was not found on PATH."
}

if (-not (Test-Path $VENV_PYTHON)) {
    Write-Host "[INFO] Creating Python virtualenv and installing backend dependencies..." -ForegroundColor Yellow
    Push-Location $BACKEND
    python -m venv .venv
    & .\.venv\Scripts\python.exe -m pip install --upgrade pip
    & .\.venv\Scripts\python.exe -m pip install -r requirements.txt
    Pop-Location
}

if (-not (Test-Path (Join-Path $FRONTEND "node_modules"))) {
    Write-Host "[INFO] Installing frontend dependencies (first run)..." -ForegroundColor Yellow
    Push-Location $FRONTEND
    npm install
    Pop-Location
}

Write-Host "[1/2] Starting FastAPI backend on http://localhost:8000 ..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    param($dir, $python)
    Set-Location $dir
    & $python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0
} -ArgumentList $BACKEND, $VENV_PYTHON

Write-Host "[2/2] Starting Next.js frontend on http://localhost:3000 ..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npm run dev
} -ArgumentList $FRONTEND

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Frontend : http://localhost:3000" -ForegroundColor White
Write-Host "  Backend  : http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs : http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Health   : http://localhost:8000/health" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both services." -ForegroundColor DarkGray
Write-Host ""

try {
    while ($true) {
        $backendJob  | Receive-Job | ForEach-Object { Write-Host "[BACKEND] $_"  -ForegroundColor DarkCyan }
        $frontendJob | Receive-Job | ForEach-Object { Write-Host "[FRONTEND] $_" -ForegroundColor DarkGreen }
        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host "Shutting down..." -ForegroundColor Yellow
    Stop-Job  $backendJob, $frontendJob
    Remove-Job $backendJob, $frontendJob
    Write-Host "Done. Goodbye!" -ForegroundColor Cyan
}
