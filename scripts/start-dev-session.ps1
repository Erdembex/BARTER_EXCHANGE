# Passla — PC acilisinda gelistirme oturumu
# Usage: .\scripts\start-dev-session.ps1
#        .\scripts\start-dev-session.ps1 -StartExpo

param(
  [switch]$StartExpo
)

$ApiUrl = "https://api.passla.com.tr"
$RepoRoot = Split-Path $PSScriptRoot -Parent

Write-Host ""
Write-Host "=== Passla Gelistirme Oturumu ===" -ForegroundColor Cyan

Write-Host ""
Write-Host "[1/4] Oracle backend..." -ForegroundColor Yellow
$health = curl.exe -sS -m 12 "$ApiUrl/actuator/health" 2>$null
if ($health -match '"status"\s*:\s*"UP"') {
  Write-Host "  OK  Backend UP ($ApiUrl)" -ForegroundColor Green
} else {
  Write-Host "  HATA  Backend yanit vermiyor: $health" -ForegroundColor Red
}

Write-Host ""
Write-Host "[2/4] API proxy (emulator/web)..." -ForegroundColor Yellow
& "$RepoRoot\scripts\emulator-connect.ps1"

Write-Host ""
Write-Host "[3/4] DNS (passla.com.tr)..." -ForegroundColor Yellow
& "$RepoRoot\scripts\verify-passla-dns.ps1"
if ($LASTEXITCODE -ne 0) {
  Write-Host '  DNS henuz hazir degil. docs/CLOUDFLARE_SETUP.md' -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "[4/4] Android emulator..." -ForegroundColor Yellow
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
if (Test-Path $adb) {
  $out = & $adb devices 2>$null
  if ($out -match "emulator") {
    Write-Host "  OK  Emulator bagli" -ForegroundColor Green
    & $adb reverse tcp:8888 tcp:8888 | Out-Null
    & $adb reverse tcp:8083 tcp:8083 | Out-Null
  } else {
    Write-Host '  Emulator kapali - Android Studio, Device Manager, Play' -ForegroundColor DarkYellow
  }
} else {
  Write-Host "  ADB bulunamadi" -ForegroundColor DarkYellow
}

if ($StartExpo) {
  Write-Host ""
  Write-Host "Expo baslatiliyor (8083)..." -ForegroundColor Cyan
  $expoCmd = "cd '$RepoRoot\bex'; npx expo start --port 8083 --clear"
  Start-Process powershell -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $expoCmd)
}

Write-Host ""
Write-Host "=== Komutlar ===" -ForegroundColor Cyan
Write-Host "  Expo:     cd bex; npx expo start --port 8083 --clear"
Write-Host "  Web:      http://localhost:8083"
Write-Host "  Telefon:  Expo Go, API otomatik Oracle IP"
Write-Host "  Emulator: once emulator-connect.ps1, sonra Expo"
Write-Host ""
