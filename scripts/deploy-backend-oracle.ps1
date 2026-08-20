# Oracle sunucuya backend deploy (kaynak kodu rsync + sunucuda Maven build)
# Usage: .\scripts\deploy-backend-oracle.ps1
param(
  [string]$SshKey = "$env:USERPROFILE\Downloads\ssh-key-2026-08-06.key",
  [string]$Remote = "ubuntu@150.230.158.219",
  [string]$RemoteRepo = "~/BARTER_EXCHANGE"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

if (-not (Test-Path $SshKey)) {
  Write-Error "SSH key bulunamadi: $SshKey"
}

Write-Host "==> Backend kaynak kodu sunucuya gonderiliyor..."
$backendSrc = Join-Path $Root "takkas-backend"
scp -i $SshKey -r "$backendSrc\src" "$backendSrc\pom.xml" "${Remote}:${RemoteRepo}/takkas-backend/"

Write-Host "==> Sunucuda Maven build + restart..."
# Tek satir komut: Windows CRLF ssh heredoc'u Linux'ta bozar
$remoteCmd = "set -e; cd $RemoteRepo/takkas-backend; mvn -B package -DskipTests -q; sudo cp target/takkas-backend-*.jar /opt/takkas/takkas-backend.jar; sudo systemctl restart takkas; sleep 60; curl -sS http://127.0.0.1:8080/actuator/health; echo; curl -sS -o /dev/null -w 'pending-feedback HTTP %{http_code}\n' http://127.0.0.1:8080/api/individual/applications/pending-feedback"

ssh -i $SshKey -o StrictHostKeyChecking=no $Remote $remoteCmd
Write-Host "==> Deploy tamamlandi."
