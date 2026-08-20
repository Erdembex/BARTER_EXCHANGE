# Expo Go + gercek telefon (iPhone / Android)
# Usage: .\scripts\expo-phone.ps1

$RepoRoot = "C:\Users\ERDEM\Desktop\BEX_CURSOR"
$BexDir = Join-Path $RepoRoot "bex"
$EnvFile = Join-Path $BexDir ".env.local"

@"
EXPO_PUBLIC_USE_DEMO_DATA=false
"@ | Set-Content -Path $EnvFile -Encoding UTF8

Write-Host "=== Expo (telefon) ===" -ForegroundColor Cyan
Write-Host "API otomatik: http://150.230.158.219" -ForegroundColor Green
Write-Host "Telefon ve PC ayni Wi-Fi'de olmali." -ForegroundColor DarkGray
Write-Host "Expo Go ile QR kodu tara." -ForegroundColor DarkGray
Write-Host ""

Push-Location $BexDir
npx expo start --port 8083 --clear
Pop-Location
