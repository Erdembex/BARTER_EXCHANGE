#!/bin/bash
set -euo pipefail
BACKUP_DIR=/backup
mkdir -p "$BACKUP_DIR"
pg_dump -U takkas takkas | gzip > "$BACKUP_DIR/takkas-$(date +%F).sql.gz"
find "$BACKUP_DIR" -name 'takkas-*.sql.gz' -mtime +14 -delete
