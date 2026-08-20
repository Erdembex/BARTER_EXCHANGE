# Passla — Production Altyapı Kurulumu

Domain: **passla.com.tr** · API: **api.passla.com.tr** · Paket: **com.passla.app**

## 1. AWS S3 (medya + CV)

Rehber: [`takkas-backend/deploy/aws/S3_SETUP.md`](../takkas-backend/deploy/aws/S3_SETUP.md)

Sunucu `.env` örneği:

```env
MEDIA_STORAGE=s3
AWS_REGION=eu-central-1
AWS_S3_BUCKET=passla-media-prod
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

Yerel disk modu (geçici): `MEDIA_STORAGE=local` — `/var/takkas/uploads`

## 2. SendGrid (e-posta)

Rehber: [`takkas-backend/deploy/mail/MAIL_SETUP.md`](../takkas-backend/deploy/mail/MAIL_SETUP.md)

1. SendGrid → Settings → Sender Authentication → **passla.com.tr**
2. Natro DNS'e SendGrid CNAME kayıtlarını ekle
3. `.env`:

```env
MAIL_ENABLED=true
SENDGRID_API_KEY=SG....
MAIL_FROM=noreply@passla.com.tr
MAIL_FROM_NAME=Passla
```

## 3. Firebase (push + App Check)

Rehber: [`FIREBASE_PRODUCTION.md`](FIREBASE_PRODUCTION.md)

1. Firebase Console → Android app: **`com.passla.app`**
2. iOS app: **`com.passla.app`**
3. Service Account JSON → sunucuya `/opt/takkas/firebase-sa.json`
4. `.env`:

```env
FIREBASE_CREDENTIALS=/opt/takkas/firebase-sa.json
```

5. EAS secrets: `EXPO_PUBLIC_FIREBASE_*` değerleri

## 4. Backend .env üretimi

```bash
cd takkas-backend
bash deploy/scripts/generate-env.sh api.passla.com.tr
# .env.generated düzenle → sunucuya /opt/takkas/.env
```

## 5. Doğrulama checklist

| Servis | Test |
|--------|------|
| API | `curl https://api.passla.com.tr/actuator/health` |
| Gizlilik | `https://passla.com.tr/gizlilik.html` |
| S3 upload | Profil fotoğrafı / CV yükle |
| Mail | Şifre sıfırlama e-postası |
| Push | Bildirim token kaydı + test push |

## 6. EAS production secrets

```powershell
cd bex
.\scripts\setup-eas-secrets.ps1 -ApiDomain api.passla.com.tr
```
