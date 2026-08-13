#!/usr/bin/env bash
# Domain + SSL + BASE_URL guncelleme (tek komut)
# Usage: sudo bash deploy/scripts/setup-production-domain.sh api.barterex.com.tr
set -euo pipefail

API_DOMAIN="${1:-}"
if [[ -z "$API_DOMAIN" ]]; then
  echo "Usage: sudo bash deploy/scripts/setup-production-domain.sh api.SENIN-DOMAIN"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="/opt/takkas/.env"

echo "==> Nginx + SSL: $API_DOMAIN"
bash "$SCRIPT_DIR/setup-nginx-ssl.sh" "$API_DOMAIN"

if [[ -f "$ENV_FILE" ]]; then
  if grep -q '^BASE_URL=' "$ENV_FILE"; then
    sudo sed -i "s|^BASE_URL=.*|BASE_URL=https://${API_DOMAIN}|" "$ENV_FILE"
  else
    echo "BASE_URL=https://${API_DOMAIN}" | sudo tee -a "$ENV_FILE" >/dev/null
  fi
  echo "==> BASE_URL guncellendi"
  sudo systemctl restart takkas
fi

echo "==> Test: curl -sS https://${API_DOMAIN}/actuator/health"
