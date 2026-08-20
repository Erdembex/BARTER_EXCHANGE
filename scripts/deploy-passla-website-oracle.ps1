# Passla website + production domain kurulumu (Oracle)
# DNS (@ + api -> 150.230.158.219) yayıldıktan sonra calistir.
# Usage: .\scripts\deploy-passla-website-oracle.ps1
param(
  [string]$SshKey = "$env:USERPROFILE\Downloads\ssh-key-2026-08-06.key",
  [string]$Remote = "ubuntu@150.230.158.219",
  [string]$RemoteRepo = "~/BARTER_EXCHANGE",
  [string]$Domain = "passla.com.tr"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

Write-Host "==> website/ sunucuya gonderiliyor..."
scp -i $SshKey -r (Join-Path $Root "website\*") "${Remote}:${RemoteRepo}/website/"

Write-Host "==> Nginx + SSL kurulumu..."
$cmd = "cd $RemoteRepo/takkas-backend && sudo bash deploy/scripts/setup-passla-production.sh $Domain"
ssh -i $SshKey -o StrictHostKeyChecking=no $Remote $cmd

Write-Host "==> Dogrulama..."
try {
  Invoke-RestMethod "https://api.$Domain/actuator/health" -TimeoutSec 15 | ConvertTo-Json
} catch { Write-Warning "API HTTPS henuz hazir olmayabilir: $_" }
