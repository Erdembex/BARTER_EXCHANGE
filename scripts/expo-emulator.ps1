# Expo Go + Android emulator — tek komutla tunel + Metro
# Usage: .\scripts\expo-emulator.ps1

$RepoRoot = "C:\Users\ERDEM\Desktop\BEX_CURSOR"
$BexDir = Join-Path $RepoRoot "bex"
$EnvFile = Join-Path $BexDir ".env.local"

& "$RepoRoot\scripts\emulator-connect.ps1"

@"
EXPO_PUBLIC_USE_DEMO_DATA=false
"@ | Set-Content -Path $EnvFile -Encoding UTF8

Write-Host "=== Expo baslatiliyor (Android emulator, port 8083) ===" -ForegroundColor Cyan
Write-Host "API otomatik: http://127.0.0.1:8888 (proxy + adb reverse)" -ForegroundColor Green
Write-Host ""

Push-Location $BexDir
npx expo start --port 8083 --clear
Pop-Location
