#!/usr/bin/env bash
# Günlük PostgreSQL yedekleme cron job
# Usage: sudo bash deploy/scripts/install-backup-cron.sh
set -euo pipefail

CRON_FILE="/etc/cron.daily/takkas-backup"
sudo tee "$CRON_FILE" > /dev/null <<'EOF'
#!/bin/bash
set -euo pipefail
BACKUP_DIR="/backup"
mkdir -p "$BACKUP_DIR"
pg_dump -U takkas takkas | gzip > "$BACKUP_DIR/takkas-$(date +%F).sql.gz"
find "$BACKUP_DIR" -name 'takkas-*.sql.gz' -mtime +14 -delete
EOF
sudo chmod +x "$CRON_FILE"
echo "==> Yedekleme cron kuruldu: $CRON_FILE (14 günden eski silinir)"
