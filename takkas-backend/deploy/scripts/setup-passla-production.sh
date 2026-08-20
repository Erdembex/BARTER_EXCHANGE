#!/usr/bin/env bash
# Passla production domain: website + API SSL + BASE_URL
# Usage: sudo bash deploy/scripts/setup-passla-production.sh passla.com.tr
set -euo pipefail

ROOT_DOMAIN="${1:-passla.com.tr}"
API_DOMAIN="api.${ROOT_DOMAIN}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Passla production: ${ROOT_DOMAIN} + ${API_DOMAIN}"

bash "$SCRIPT_DIR/setup-passla-website.sh" "$ROOT_DOMAIN"
bash "$SCRIPT_DIR/setup-nginx-ssl.sh" "$API_DOMAIN"

ENV_FILE="/opt/takkas/.env"
if [[ -f "$ENV_FILE" ]]; then
  if grep -q '^BASE_URL=' "$ENV_FILE"; then
    sudo sed -i "s|^BASE_URL=.*|BASE_URL=https://${API_DOMAIN}|" "$ENV_FILE"
  else
    echo "BASE_URL=https://${API_DOMAIN}" | sudo tee -a "$ENV_FILE" >/dev/null
  fi
  sudo systemctl restart takkas
fi

echo "==> Website SSL..."
sudo certbot --nginx -d "$ROOT_DOMAIN" --non-interactive --agree-tos \
  -m "destek@${ROOT_DOMAIN}" --redirect || {
  echo "Certbot interaktif gerekebilir: sudo certbot --nginx -d ${ROOT_DOMAIN}"
}

echo "==> Test:"
echo "  curl -sS https://${ROOT_DOMAIN}/gizlilik.html | head"
echo "  curl -sS https://${API_DOMAIN}/actuator/health"
