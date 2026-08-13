# Mağaza submit hazırlık (credentials doldurulunca)
# Usage: .\scripts\prepare-store-submit.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "==> Kontroller" -ForegroundColor Cyan

$checks = @(
  @{ Path = "..\website\gizlilik.html"; Label = "Gizlilik sayfasi" },
  @{ Path = "store-listing\metadata.json"; Label = "Store metadata" },
  @{ Path = "assets\icon.png"; Label = "App icon" }
)

foreach ($c in $checks) {
  if (Test-Path $c.Path) { Write-Host "  [OK] $($c.Label)" -ForegroundColor Green }
  else { Write-Host "  [EKSIK] $($c.Label)" -ForegroundColor Red }
}

if (-not (Test-Path "google-play-service-account.json")) {
  Write-Host "`nPlay: google-play-service-account.json yok" -ForegroundColor Yellow
  Write-Host "  Play Console > API access > Service account JSON indir"
}

$eas = Get-Content "eas.json" -Raw
if ($eas -match "YOUR_APPLE_ID") {
  Write-Host "iOS: eas.json appleId / ascAppId guncelle" -ForegroundColor Yellow
}

Write-Host "`nDomain + SSL sonrasi:" -ForegroundColor Cyan
Write-Host "  npm run build:production:android"
Write-Host "  npm run submit:android"
