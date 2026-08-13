#!/usr/bin/env bash
# Günlük PostgreSQL yedekleme cron job
# Usage: sudo bash deploy/scripts/install-backup-cron.sh
set -euo pipefail

CRON_FILE="/etc/cron.daily/takkas-backup"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sudo cp "$SCRIPT_DIR/takkas-backup.cron.sh" "$CRON_FILE"
sudo chmod +x "$CRON_FILE"
echo "==> Yedekleme cron kuruldu: $CRON_FILE (14 günden eski silinir)"
