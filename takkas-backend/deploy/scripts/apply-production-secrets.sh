#!/usr/bin/env bash
# Sunucu .env dosyasina S3 / SendGrid degerlerini ekle veya guncelle
# Usage: sudo bash deploy/scripts/apply-production-secrets.sh /path/to/secrets.env
#
# secrets.env ornegi:
#   AWS_ACCESS_KEY_ID=AKIA...
#   AWS_SECRET_ACCESS_KEY=...
#   AWS_S3_BUCKET=bex-media-prod
#   AWS_S3_REGION=eu-central-1
#   SPRING_MAIL_PASSWORD=SG....
#   STORAGE_PROVIDER=s3
set -euo pipefail

SECRETS="${1:-}"
ENV_FILE="/opt/takkas/.env"

if [[ -z "$SECRETS" || ! -f "$SECRETS" ]]; then
  echo "Usage: sudo bash deploy/scripts/apply-production-secrets.sh secrets.env"
  exit 1
fi

upsert() {
  local key="$1"
  local val="$2"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$ENV_FILE"
  else
    echo "${key}=${val}" >> "$ENV_FILE"
  fi
}

while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" =~ ^# ]] && continue
  value="${value//$'\r'/}"
  upsert "$key" "$value"
done < "$SECRETS"

echo "==> Secrets uygulandi. Servis yeniden baslatiliyor..."
systemctl restart takkas
sleep 10
curl -sS http://127.0.0.1:8080/actuator/health || true
