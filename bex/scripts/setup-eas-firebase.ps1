# EAS Firebase secrets (API key + App ID + messaging sender)
# Usage: degerleri .env.firebase.local doldur -> .\scripts\setup-eas-firebase.ps1

param(
  [string]$EnvFile = ".env.firebase.local"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Test-Path $EnvFile)) {
  Copy-Item ".env.firebase.example" $EnvFile
  Write-Host "Olusturuldu: $EnvFile - Firebase Console degerlerini doldur ve tekrar calistir." -ForegroundColor Yellow
  exit 1
}

Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$') {
    Set-Variable -Name $Matches[1] -Value $Matches[2].Trim()
  }
}

npx eas whoami 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Once: npx eas login"
  exit 1
}

function Set-Secret($n, $v) {
  if ([string]::IsNullOrWhiteSpace($v)) {
    Write-Host "  ATLA: $n" -ForegroundColor DarkYellow
    return
  }
  Write-Host "  -> $n" -ForegroundColor Green
  npx eas secret:create --name $n --value $v --force
}

Write-Host "==> Firebase EAS secrets" -ForegroundColor Cyan
Set-Secret "EXPO_PUBLIC_FIREBASE_API_KEY" $EXPO_PUBLIC_FIREBASE_API_KEY
Set-Secret "EXPO_PUBLIC_FIREBASE_APP_ID" $EXPO_PUBLIC_FIREBASE_APP_ID
Set-Secret "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" $EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Set-Secret "EXPO_PUBLIC_FIREBASE_PROJECT_ID" "paa-5b0c2"
Set-Secret "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN" "paa-5b0c2.firebaseapp.com"
Set-Secret "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET" "paa-5b0c2.firebasestorage.app"

Write-Host "Tamam." -ForegroundColor Green
