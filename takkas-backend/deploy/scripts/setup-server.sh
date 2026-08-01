#!/usr/bin/env bash
# Oracle VM / Ubuntu sunucu ilk kurulum scripti
set -euo pipefail

echo "==> Sistem güncelleniyor..."
sudo apt update && sudo apt upgrade -y

echo "==> Paketler kuruluyor..."
sudo apt install -y \
  openjdk-21-jdk \
  nginx \
  certbot \
  python3-certbot-nginx \
  git \
  postgresql \
  postgresql-contrib \
  redis-server \
  ufw

echo "==> Java sürümü:"
java -version

echo "==> Dizinler oluşturuluyor..."
sudo mkdir -p /opt/takkas /var/takkas/uploads /backup
sudo chown -R "$USER:$USER" /opt/takkas /var/takkas/uploads

echo "==> Redis etkinleştiriliyor..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

echo "==> UFW (opsiyonel — SSH portunu kapatma!)"
echo "Manuel: sudo ufw allow 22 && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw enable"

echo ""
echo "Sonraki adımlar:"
echo "  1. PostgreSQL kullanıcı/DB oluştur (docs/ORACLE_DEPLOY.md)"
echo "  2. /opt/takkas/.env dosyasını kopyala"
echo "  3. JAR deploy: deploy/scripts/deploy-jar.sh"
echo "  4. Nginx + certbot: docs/ORACLE_DEPLOY.md"
