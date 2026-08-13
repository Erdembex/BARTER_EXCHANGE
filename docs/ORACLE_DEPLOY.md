# Oracle Cloud Backend Deployment

## 1. VM oluştur

1. Oracle Console → Compute → Instances → Create Instance
2. Shape: **VM.Standard.A1.Flex** (Always Free — 4 OCPU / 24 GB)
3. Image: Ubuntu 22.04
4. Boot volume: 50–100 GB
5. SSH key pair indir
6. Security List portları: 22 (sadece senin IP), 80, 443, 8080 (test)

## 1b. VM içi firewall (iptables)

Oracle Ubuntu imajında **sadece 22 açık** gelir; Security List yetmez:

```bash
sudo bash deploy/scripts/open-vm-ports.sh
```

## 2. Sunucu kurulumu

```bash
ssh -i oracle-key.pem ubuntu@SUNUCU_IP
```

**Tek komut (önerilen):**
```bash
git clone https://github.com/Erdembex/BARTER_EXCHANGE.git
cd BARTER_EXCHANGE/takkas-backend
bash deploy/scripts/full-server-setup.sh
```

Veya adım adım:
```bash
bash deploy/scripts/setup-server.sh
sudo bash deploy/scripts/setup-postgres.sh GÜÇLÜ_ŞİFRE
```

## 3. Backend deploy (JAR)

**Env üret (lokal):**
```bash
cd takkas-backend
bash deploy/scripts/generate-env.sh api.SENIN-DOMAIN
# .env.generated → düzenle → .env olarak kaydet
```

Lokal makinede (Maven varsa) veya GitHub Actions artifact:

```bash
cd takkas-backend
bash deploy/scripts/deploy-jar.sh ubuntu@SUNUCU_IP oracle-key.pem
scp -i oracle-key.pem firebase-sa.json ubuntu@SUNUCU_IP:/opt/takkas/firebase-sa.json
```

Maven yoksa: GitHub → Actions → Backend Build → artifact indir → `JAR_PATH=... deploy-jar.sh ...`

Sunucuda systemd + SSL:
```bash
sudo bash deploy/scripts/install-systemd.sh
sudo bash deploy/scripts/setup-nginx-ssl.sh api.SENIN-DOMAIN
sudo bash deploy/scripts/install-backup-cron.sh
```

## 4. Nginx + SSL

DNS: `api.SENIN-DOMAIN` → VM public IP (A kaydı)

```bash
sudo bash deploy/scripts/setup-nginx-ssl.sh api.SENIN-DOMAIN
```

Manuel alternatif: [`deploy/nginx/takkas.conf.template`](../takkas-backend/deploy/nginx/takkas.conf.template)

**Domain yokken (sadece IP):**

```bash
sudo bash deploy/scripts/setup-nginx-ip.sh
curl http://SUNUCU_IP/actuator/health
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
sudo bash deploy/scripts/install-backup-cron.sh
```

## 7. Doğrulama

```bash
curl https://api.SENIN-DOMAIN/actuator/health
journalctl -u takkas -f
```
