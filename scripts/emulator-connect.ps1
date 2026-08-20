# Emulator -> PC API + Metro tuneli (Windows Firewall'u atlar)
# Usage: .\scripts\emulator-connect.ps1

$RepoRoot = "C:\Users\ERDEM\Desktop\BEX_CURSOR"
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

Write-Host "=== Emulator Baglantisi (API + Metro) ===" -ForegroundColor Cyan

$oracle = curl.exe -sS -m 10 https://api.passla.com.tr/actuator/health 2>$null
if ($oracle -match '"status"\s*:\s*"UP"') {
  Write-Host "OK  Oracle backend UP" -ForegroundColor Green
} else {
  Write-Host "HATA  Oracle backend yanit vermiyor" -ForegroundColor Red
  Write-Host "      $oracle" -ForegroundColor DarkYellow
}

function Test-ProxyUp {
  $health = curl.exe -sS -m 4 http://127.0.0.1:8888/actuator/health 2>$null
  return $health -match '"status"\s*:\s*"UP"'
}

if (-not (Test-ProxyUp)) {
  Write-Host "Proxy baslatiliyor (8888)..." -ForegroundColor Yellow
  Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"node '$RepoRoot\scripts\emulator-api-proxy.mjs'`"" -WindowStyle Minimized
  for ($i = 0; $i -lt 6; $i++) {
    Start-Sleep -Seconds 1
    if (Test-ProxyUp) { break }
  }
}

if (Test-Path $adb) {
  & $adb reverse tcp:8888 tcp:8888 | Out-Null
  & $adb reverse tcp:8081 tcp:8081 | Out-Null
  & $adb reverse tcp:8083 tcp:8083 | Out-Null
  Write-Host "OK  adb reverse: 8888 (API), 8081/8083 (Metro)" -ForegroundColor Green
  $devices = & $adb devices 2>$null
  if ($devices -notmatch "emulator") {
    Write-Host "UYARI  Emulator kapali - Android Studio > Device Manager > Play" -ForegroundColor DarkYellow
  }
} else {
  Write-Host "HATA  ADB bulunamadi" -ForegroundColor Red
}

if (Test-ProxyUp) {
  Write-Host "OK  Proxy + backend hazir" -ForegroundColor Green
  Write-Host "    Expo Go / emulator API: http://127.0.0.1:8888" -ForegroundColor DarkGray
  Write-Host "    (.env.local bu adresi kullanmali)" -ForegroundColor DarkGray
} else {
  Write-Host "HATA  Proxy ayaga kalkmadi" -ForegroundColor Red
  Write-Host "      Manuel: node scripts\emulator-api-proxy.mjs" -ForegroundColor DarkYellow
}

Write-Host ""
