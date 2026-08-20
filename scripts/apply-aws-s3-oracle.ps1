# AWS S3 secret'larini Oracle sunucuya uygular (key'ler chat'e gitmez)
# Usage:
#   1) secrets.local.env.example -> secrets.local.env kopyala, degerleri doldur
#   2) .\scripts\apply-aws-s3-oracle.ps1

param(
  [string]$SshKey = "$env:USERPROFILE\Downloads\ssh-key-2026-08-06.key",
  [string]$Remote = "ubuntu@150.230.158.219",
  [string]$SecretsFile = ""
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

if ([string]::IsNullOrWhiteSpace($SecretsFile)) {
  $SecretsFile = Join-Path $Root "takkas-backend\deploy\aws\secrets.local.env"
}

if (-not (Test-Path $SecretsFile)) {
  Write-Error @"
secrets.local.env bulunamadi: $SecretsFile

Once su dosyayi olustur:
  takkas-backend\deploy\aws\secrets.local.env.example -> secrets.local.env
CSV'deki Erişim anahtari ve Gizli erişim anahtari degerlerini yapistir.
"@
}

if (-not (Test-Path $SshKey)) {
  Write-Error "SSH key bulunamadi: $SshKey"
}

Write-Host "==> S3 ayarlari sunucuya gonderiliyor..."
scp -i $SshKey $SecretsFile "${Remote}:/tmp/passla-aws-secrets.env"

Write-Host "==> Sunucuda .env guncelleniyor + takkas yeniden baslatiliyor..."
$remoteCmd = "bash -s" 
$bashScript = @'
set -e
ENV_FILE="/opt/takkas/.env"
sudo touch "$ENV_FILE"
while IFS='=' read -r key value || [ -n "$key" ]; do
  [ -z "$key" ] && continue
  case "$key" in \#*) continue ;; esac
  value="${value//$'\r'/}"
  if sudo grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sudo sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" | sudo tee -a "$ENV_FILE" >/dev/null
  fi
done < /tmp/passla-aws-secrets.env
rm -f /tmp/passla-aws-secrets.env
sudo systemctl restart takkas
sleep 45
curl -sS -m 15 http://127.0.0.1:8080/actuator/health || echo HEALTH_FAIL
echo
sudo grep -E '^STORAGE_PROVIDER=|^AWS_S3_BUCKET=' "$ENV_FILE"
'@

$bashScript | ssh -i $SshKey -o StrictHostKeyChecking=no $Remote $remoteCmd
Write-Host "==> Bitti. Uygulamadan foto yukleyerek test et."
