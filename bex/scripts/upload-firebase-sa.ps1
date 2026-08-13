# Firebase service account JSON -> Oracle sunucu
# Usage: .\scripts\upload-firebase-sa.ps1 -LocalPath C:\path\firebase-sa.json

param(
  [Parameter(Mandatory = $true)]
  [string]$LocalPath,
  [string]$RemoteHost = "150.230.158.219",
  [string]$Key = "$env:USERPROFILE\Downloads\ssh-key-2026-08-06.key"
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path $LocalPath)) {
  Write-Error "Dosya yok: $LocalPath"
}

$remote = "ubuntu@$RemoteHost"
$sshOpts = @()
$scpOpts = @()
if (Test-Path $Key) {
  $sshOpts = @("-i", $Key)
  $scpOpts = @("-i", $Key)
}

Write-Host "==> Sunucuya yukleniyor: /opt/takkas/firebase-sa.json" -ForegroundColor Cyan
scp @scpOpts $LocalPath "${remote}:/tmp/firebase-sa.json"
ssh @sshOpts $remote @"
sudo mv /tmp/firebase-sa.json /opt/takkas/firebase-sa.json
sudo chown ubuntu:ubuntu /opt/takkas/firebase-sa.json
sudo chmod 600 /opt/takkas/firebase-sa.json
sudo systemctl restart takkas
sleep 10
curl -sS http://127.0.0.1:8080/actuator/health
"@

Write-Host "Tamam. Push test icin mobilde bildirim izni ver." -ForegroundColor Green
