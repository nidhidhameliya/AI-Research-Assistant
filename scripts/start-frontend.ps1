Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

Get-Content ".env" | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]+)=(.*)$") {
        [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
    }
}

if (-not $env:INTERNAL_API_URL) {
    [Environment]::SetEnvironmentVariable("INTERNAL_API_URL", "http://127.0.0.1:8000", "Process")
}

Set-Location ".\frontend"
& npm run dev
