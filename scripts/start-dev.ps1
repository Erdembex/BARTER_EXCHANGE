# BEX yerel geliştirme — Backend + Expo (ayrı pencereler)
$root = Split-Path $PSScriptRoot -Parent
$backend = Join-Path $root "takkas-backend"
$bex = Join-Path $root "bex"
$mvn = Join-Path $backend ".tools\apache-maven-3.9.9\bin\mvn.cmd"

Write-Host "Backend ve Expo ayri PowerShell pencerelerinde aciliyor..." -ForegroundColor Yellow

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$backend'; Write-Host '=== BEX BACKEND (8080) ===' -ForegroundColor Cyan; & '$mvn' spring-boot:run '-Dspring-boot.run.profiles=dev'"
)

Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "cd '$bex'; Write-Host '=== BEX EXPO (8085) ===' -ForegroundColor Cyan; npx expo start --port 8085"
)

Write-Host ""
Write-Host "Hazir olunca:" -ForegroundColor Green
Write-Host "  Web:     http://localhost:8085  (w tusuna bas)"
Write-Host "  Backend: http://localhost:8080"
Write-Host "  Sifre kodu logu: backend penceresinde Ctrl+F -> PasswordReset"
