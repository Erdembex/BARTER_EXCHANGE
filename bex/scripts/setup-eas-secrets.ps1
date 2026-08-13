# BEX — EAS production secrets kurulumu (Windows)
# Usage: .\scripts\setup-eas-secrets.ps1 -ApiDomain "api.bex.app"
param(
  [string]$ApiDomain = "",
  [string]$ApiUrl = "",
  [string]$EasProjectId = "",
  [string]$FirebaseApiKey = "",
  [string]$FirebaseAuthDomain = "",
  [string]$FirebaseProjectId = "",
  [string]$FirebaseStorageBucket = "",
  [string]$FirebaseMessagingSenderId = "",
  [string]$FirebaseAppId = ""
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "==> EAS login kontrol..." -ForegroundColor Cyan
npx eas whoami 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Once: npx eas login" -ForegroundColor Yellow
  exit 1
}

function Set-EasSecret($Name, $Value) {
  if ([string]::IsNullOrWhiteSpace($Value)) {
    Write-Host "  ATLA: $Name (deger verilmedi)" -ForegroundColor DarkYellow
    return
  }
  Write-Host "  -> $Name" -ForegroundColor Green
  npx eas secret:create --name $Name --value $Value --force
}

if ([string]::IsNullOrWhiteSpace($ApiUrl)) {
  if ([string]::IsNullOrWhiteSpace($ApiDomain)) {
    Write-Host "ApiDomain veya ApiUrl ver." -ForegroundColor Red
    exit 1
  }
  $ApiUrl = "https://$ApiDomain"
}

Write-Host "==> Secrets olusturuluyor (API: $ApiUrl)" -ForegroundColor Cyan

Set-EasSecret "EXPO_PUBLIC_API_BASE_URL" $ApiUrl
Set-EasSecret "EXPO_PUBLIC_EAS_PROJECT_ID" $EasProjectId
Set-EasSecret "EXPO_PUBLIC_FIREBASE_API_KEY" $FirebaseApiKey
Set-EasSecret "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN" $FirebaseAuthDomain
Set-EasSecret "EXPO_PUBLIC_FIREBASE_PROJECT_ID" $FirebaseProjectId
Set-EasSecret "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET" $FirebaseStorageBucket
Set-EasSecret "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" $FirebaseMessagingSenderId
Set-EasSecret "EXPO_PUBLIC_FIREBASE_APP_ID" $FirebaseAppId
Set-EasSecret "EXPO_PUBLIC_USE_DEMO_DATA" "false"

Write-Host "`n==> Mevcut secrets:" -ForegroundColor Cyan
npx eas secret:list

Write-Host "`nTamam. Sonraki: npm run build:preview:android" -ForegroundColor Green
