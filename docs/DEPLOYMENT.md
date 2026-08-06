# BEX Production Deployment Rehberi

Bu doküman, BEX uygulamasını production ortamına çıkarmak için gereken hesapları, ortam değişkenlerini ve adım adım süreçleri özetler.

## Faz 0 — Hesap checklist

Aşağıdaki hesapları sırayla aç. Her biri için `[ ]` kutusunu tamamladıkça işaretle.

| # | Hesap | URL | Not |
|---|-------|-----|-----|
| 1 | Oracle Cloud | https://cloud.oracle.com | Always Free VM (ARM A1) |
| 2 | Amazon AWS | https://aws.amazon.com | S3 bucket için |
| 3 | Domain | Cloudflare / Namecheap | `api.bex.app`, `bex.app` |
| 4 | SendGrid veya Resend | https://sendgrid.com | Transactional mail |
| 5 | Google Play Console | https://play.google.com/console | ~25 USD tek seferlik |
| 6 | Apple Developer | https://developer.apple.com | ~99 USD/yıl |
| 7 | Expo (EAS) | https://expo.dev | Ücretsiz build kotası |
| 8 | Firebase | Mevcut proje | FCM push + App Check |

### Sanal POS (paralel, ilk yayın için zorunlu değil)

- Şahıs şirketi / limited şirket + vergi levhası
- İyzico, PayTR veya Param başvurusu (3–10 iş günü)
- Şimdilik `ManualPaymentGateway` aktif — admin panelden manuel onay

---

## Genel sıra

```
Hesaplar → Backend (Oracle/Docker) → S3 → Mail → EAS Build → Play Store → App Store
```

Detaylı adımlar:

- **Master checklist:** [`docs/STORE_LAUNCH_CHECKLIST.md`](STORE_LAUNCH_CHECKLIST.md)
- Hesap açma: [`docs/ACCOUNTS_SETUP.md`](ACCOUNTS_SETUP.md)
- Gizlilik sitesi: [`website/`](../website/)
- Backend Oracle VM: [`docs/ORACLE_DEPLOY.md`](ORACLE_DEPLOY.md)
- Docker ile deploy: [`takkas-backend/docker-compose.prod.yml`](../takkas-backend/docker-compose.prod.yml)
- Firebase production: [`docs/FIREBASE_PRODUCTION.md`](FIREBASE_PRODUCTION.md)
- Google Play: [`docs/PLAY_STORE.md`](PLAY_STORE.md) · [`docs/PLAY_CONSOLE_SETUP.md`](PLAY_CONSOLE_SETUP.md)
- App Store: [`docs/APP_STORE.md`](APP_STORE.md) · [`docs/APP_STORE_CONNECT_SETUP.md`](APP_STORE_CONNECT_SETUP.md)
- Yayın sonrası: [`docs/POST_LAUNCH.md`](POST_LAUNCH.md)

---

## Backend ortam değişkenleri

Şablon: [`takkas-backend/.env.example`](../takkas-backend/.env.example)

Production profili: `SPRING_PROFILES_ACTIVE=prod`

Kritik değerler:

```bash
JWT_SECRET=                    # En az 32 karakter, rastgele
BASE_URL=https://api.bex.app
LISTINGS_AUTO_APPROVE=false
SWAGGER_ENABLED=false
ADMIN_SEED_ENABLED=false
STORAGE_PROVIDER=s3            # local veya s3
AWS_S3_BUCKET=bex-media-prod
AWS_S3_REGION=eu-central-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
SPRING_MAIL_HOST=smtp.sendgrid.net
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=apikey
SPRING_MAIL_PASSWORD=
FIREBASE_SERVICE_ACCOUNT_PATH=/opt/takkas/firebase-sa.json
```

---

## Mobil uygulama (EAS)

Şablon: [`bex/.env.production.example`](../bex/.env.production.example)

```bash
cd bex
npx eas login
npx eas init
eas secret:create --name EXPO_PUBLIC_API_BASE_URL --value https://api.bex.app
npm run build:production
```

---

## Hızlı doğrulama

```bash
# Backend sağlık
curl https://api.bex.app/actuator/health

# Docker local test
cd takkas-backend
cp .env.example .env
docker compose -f docker-compose.prod.yml up -d
```
