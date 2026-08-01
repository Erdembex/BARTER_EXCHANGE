# Oracle Cloud Backend Deployment

## 1. VM oluştur

1. Oracle Console → Compute → Instances → Create Instance
2. Shape: **VM.Standard.A1.Flex** (Always Free — 4 OCPU / 24 GB)
3. Image: Ubuntu 22.04
4. Boot volume: 50–100 GB
5. SSH key pair indir
6. Security List portları: 22 (sadece senin IP), 80, 443

## 2. Sunucu kurulumu

```bash
ssh -i oracle-key.pem ubuntu@SUNUCU_IP
bash -s < deploy/scripts/setup-server.sh
```

Veya manuel:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y openjdk-21-jdk nginx certbot python3-certbot-nginx git postgresql postgresql-contrib redis-server
```

PostgreSQL:

```bash
sudo -u postgres psql -c "CREATE USER takkas WITH PASSWORD 'GÜÇLÜ_ŞİFRE';"
sudo -u postgres psql -c "CREATE DATABASE takkas OWNER takkas;"
```

## 3. Backend deploy (JAR)

Lokal makinede:

```bash
cd takkas-backend
mvn -B package -DskipTests
scp -i oracle-key.pem target/takkas-backend-*.jar ubuntu@SUNUCU_IP:/opt/takkas/takkas-backend.jar
scp -i oracle-key.pem .env ubuntu@SUNUCU_IP:/opt/takkas/.env
scp -i oracle-key.pem firebase-sa.json ubuntu@SUNUCU_IP:/opt/takkas/firebase-sa.json
```

Sunucuda:

```bash
sudo mkdir -p /opt/takkas /var/takkas/uploads /backup
sudo cp deploy/systemd/takkas.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable takkas
sudo systemctl start takkas
sudo systemctl status takkas
```

## 4. Nginx + SSL

DNS: `api.bex.app` → VM public IP (A kaydı)

```bash
sudo cp deploy/nginx/takkas.conf /etc/nginx/sites-available/takkas
sudo ln -sf /etc/nginx/sites-available/takkas /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.bex.app
```

## 5. Docker alternatifi

Oracle VM'de Docker kuruluysa:

```bash
cd takkas-backend
cp .env.example .env   # production değerleriyle doldur
docker compose -f docker-compose.prod.yml up -d
```

## 6. Yedekleme (cron)

```bash
# /etc/cron.daily/takkas-backup
pg_dump -U takkas takkas | gzip > /backup/takkas-$(date +%F).sql.gz
```

## 7. Doğrulama

```bash
curl https://api.bex.app/actuator/health
journalctl -u takkas -f
```
