#!/usr/bin/env bash
# Nginx reverse proxy + Let's Encrypt SSL
# Usage: sudo bash deploy/scripts/setup-nginx-ssl.sh api.example.com
set -euo pipefail

DOMAIN="${1:-}"
if [[ -z "$DOMAIN" ]]; then
  echo "Usage: sudo bash deploy/scripts/setup-nginx-ssl.sh api.SENIN-DOMAIN"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONF="/etc/nginx/sites-available/takkas"

echo "==> Nginx config: $DOMAIN"
sudo cp "$REPO_ROOT/deploy/nginx/takkas.conf.template" "$CONF"
sudo sed -i "s/__API_DOMAIN__/${DOMAIN}/g" "$CONF"
sudo ln -sf "$CONF" /etc/nginx/sites-enabled/takkas
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
sudo nginx -t
sudo systemctl reload nginx

echo "==> Certbot SSL..."
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@${DOMAIN#api.}" || {
  echo "Certbot interaktif mod gerekebilir: sudo certbot --nginx -d $DOMAIN"
}

echo "==> Doğrulama: curl https://${DOMAIN}/actuator/health"
