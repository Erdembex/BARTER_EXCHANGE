#!/usr/bin/env bash
set -euo pipefail
sudo -u postgres psql -d takkas <<'SQL'
UPDATE users SET user_type = 'ADMIN' WHERE email = 'admin@bex.dev';
SELECT email, user_type FROM users WHERE email = 'admin@bex.dev';
SQL
if grep -q '^ADMIN_SEED_ENABLED=' /opt/takkas/.env 2>/dev/null; then
  sudo sed -i 's/^ADMIN_SEED_ENABLED=.*/ADMIN_SEED_ENABLED=true/' /opt/takkas/.env
else
  echo 'ADMIN_SEED_ENABLED=true' | sudo tee -a /opt/takkas/.env >/dev/null
fi
grep -q '^ADMIN_EMAIL=' /opt/takkas/.env 2>/dev/null || echo 'ADMIN_EMAIL=admin@bex.dev' | sudo tee -a /opt/takkas/.env >/dev/null
