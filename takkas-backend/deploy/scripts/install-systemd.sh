#!/usr/bin/env bash
# systemd servisini kurar ve etkinleştirir
# Usage: sudo bash deploy/scripts/install-systemd.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "==> systemd servisi kuruluyor..."
sudo cp "$REPO_ROOT/deploy/systemd/takkas.service" /etc/systemd/system/takkas.service
sudo systemctl daemon-reload
sudo systemctl enable takkas

if [[ -f /opt/takkas/takkas-backend.jar ]]; then
  sudo systemctl restart takkas
  sudo systemctl status takkas --no-pager
else
  echo "JAR henüz yok. deploy-jar.sh çalıştırınca: sudo systemctl start takkas"
fi

echo "==> Log: journalctl -u takkas -f"
