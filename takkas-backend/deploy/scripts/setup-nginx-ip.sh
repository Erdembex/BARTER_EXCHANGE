#!/usr/bin/env bash
# Nginx reverse proxy (IP ile, domain yokken)
# Usage: sudo bash deploy/scripts/setup-nginx-ip.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CONF="/etc/nginx/sites-available/takkas"

echo "==> Nginx IP proxy (80 -> 8080)"
sudo cp "$REPO_ROOT/deploy/nginx/takkas-ip.conf" "$CONF"
sudo ln -sf "$CONF" /etc/nginx/sites-enabled/takkas
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
sudo nginx -t
sudo systemctl reload nginx
echo "==> Test: curl http://127.0.0.1/actuator/health"
