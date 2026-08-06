#!/usr/bin/env bash
# PostgreSQL kullanıcı ve veritabanı oluşturur
# Usage: sudo bash deploy/scripts/setup-postgres.sh [password]
set -euo pipefail

DB_USER="${DB_USER:-takkas}"
DB_NAME="${DB_NAME:-takkas}"
DB_PASS="${1:-}"

if [[ -z "$DB_PASS" ]]; then
  echo "Usage: sudo bash deploy/scripts/setup-postgres.sh GÜÇLÜ_ŞİFRE"
  exit 1
fi

echo "==> PostgreSQL kullanıcı ve DB oluşturuluyor..."
sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

echo "==> Tamam. .env dosyasında DB_PASS=${DB_PASS} olarak ayarla."
