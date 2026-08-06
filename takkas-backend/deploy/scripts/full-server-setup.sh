#!/usr/bin/env bash
# Oracle VM tam ilk kurulum — SSH ile sunucuda çalıştır
# Usage: curl -sL ... | bash   veya   bash deploy/scripts/full-server-setup.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "$SCRIPT_DIR/setup-server.sh"

echo ""
echo "==> PostgreSQL şifresi gir (DB_PASS):"
read -rs DB_PASS
echo ""
sudo bash "$SCRIPT_DIR/setup-postgres.sh" "$DB_PASS"

echo ""
echo "==> Sonraki adımlar (lokal makineden):"
echo "  1. takkas-backend/.env oluştur (deploy/scripts/generate-env.sh)"
echo "  2. firebase-sa.json ve .env'i sunucuya yükle"
echo "  3. bash deploy/scripts/deploy-jar.sh ubuntu@SUNUCU_IP oracle-key.pem"
echo "  4. sudo bash deploy/scripts/install-systemd.sh"
echo "  5. sudo bash deploy/scripts/setup-nginx-ssl.sh api.SENIN-DOMAIN"
echo "  6. sudo bash deploy/scripts/install-backup-cron.sh"
