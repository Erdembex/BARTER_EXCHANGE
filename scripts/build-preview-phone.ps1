# Passla — preview-phone APK (telefon test, Oracle IP)
# Ilk calistirmada EAS imza anahtari (keystore) olusturur — terminalde "Yes" de.
# Usage: .\scripts\build-preview-phone.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path $PSScriptRoot -Parent

Write-Host "=== Passla preview-phone APK ===" -ForegroundColor Cyan
Write-Host "API: http://150.230.158.219" -ForegroundColor DarkGray
Write-Host ""

$health = curl.exe -sS -m 10 http://150.230.158.219/actuator/health 2>$null
if ($health -notmatch '"status"\s*:\s*"UP"') {
  Write-Host "UYARI: Backend UP gorunmuyor. Yine de build alinabilir." -ForegroundColor Yellow
} else {
  Write-Host "OK  Backend UP" -ForegroundColor Green
}

Write-Host ""
Write-Host "EAS build basliyor (ilk seferde keystore sorusuna Yes de)..." -ForegroundColor Yellow
Write-Host ""

Push-Location "$RepoRoot\bex"
try {
  npx eas build --profile preview-phone --platform android
  if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Build kuyruga alindi. Takip:" -ForegroundColor Green
    Write-Host "  npx eas build:list --platform android --limit 1" -ForegroundColor DarkGray
    Write-Host "  veya https://expo.dev" -ForegroundColor DarkGray
  }
} finally {
  Pop-Location
}
