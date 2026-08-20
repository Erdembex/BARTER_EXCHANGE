#!/usr/bin/env bash
# Passla statik website — Oracle VM nginx
# Usage: sudo bash deploy/scripts/setup-passla-website.sh passla.com.tr
set -euo pipefail

ROOT_DOMAIN="${1:-passla.com.tr}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WEB_ROOT="/var/www/passla/website"
WEBSITE_SRC="$(cd "$REPO_ROOT/../website" 2>/dev/null && pwd || true)"

if [[ -z "$WEBSITE_SRC" || ! -d "$WEBSITE_SRC" ]]; then
  WEBSITE_SRC="$(cd "$REPO_ROOT/../../website" 2>/dev/null && pwd || true)"
fi
if [[ -z "$WEBSITE_SRC" || ! -d "$WEBSITE_SRC" ]]; then
  echo "HATA: website/ klasoru bulunamadi. Repo kokunden calistirin."
  exit 1
fi

echo "==> Website dosyalari: $WEBSITE_SRC -> $WEB_ROOT"
sudo mkdir -p "$WEB_ROOT"
sudo rsync -a --delete "$WEBSITE_SRC/" "$WEB_ROOT/" \
  --exclude README.md --exclude _redirects
sudo chown -R www-data:www-data /var/www/passla

CONF="/etc/nginx/sites-available/passla-website"
sudo cp "$REPO_ROOT/deploy/nginx/passla-website.conf.template" "$CONF"
sudo sed -i "s/__ROOT_DOMAIN__/${ROOT_DOMAIN}/g" "$CONF"
sudo ln -sf "$CONF" /etc/nginx/sites-enabled/passla-website
sudo nginx -t
sudo systemctl reload nginx

echo "==> Website hazir: http://${ROOT_DOMAIN}/gizlilik.html"
echo "SSL icin: sudo certbot --nginx -d ${ROOT_DOMAIN}"
