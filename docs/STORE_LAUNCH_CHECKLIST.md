# Passla — Mağaza Yayın Master Checklist

Bu dosya tüm fazları tek yerde takip etmen için.

**Adım adım rehber:** [`LAUNCH_STEP_BY_STEP.md`](LAUNCH_STEP_BY_STEP.md)

## Faz 0 — Hazırlık

### Tamamlandı / devam eden
- [x] Uygulama rebrand: Passla, `com.passla.app`, logo/tema
- [x] Domain satın alındı: **passla.com.tr** (Natro)
- [x] [`website/`](../website/) Passla metinleri hazır
- [x] [`bex/store-listing/`](../bex/store-listing/) Passla metinleri güncellendi

### Sırada
- [ ] Natro DNS: `@` + `api` → `150.230.158.219` → [`NATRO_DNS.md`](NATRO_DNS.md)
- [ ] Oracle SSL + website deploy → `setup-passla-production.sh`
- [ ] Tüm hesaplar → [`ACCOUNTS_SETUP.md`](ACCOUNTS_SETUP.md)
- [ ] Store ekran görüntüleri (min 2 telefon)

## Faz 1 — Backend

- [x] Oracle VM ayakta (`150.230.158.219`)
- [ ] Son backend deploy (V29 bio/CV/pending-feedback)
- [ ] AWS S3 → [`takkas-backend/deploy/aws/S3_SETUP.md`](../takkas-backend/deploy/aws/S3_SETUP.md)
- [ ] SendGrid **passla.com.tr** → [`takkas-backend/deploy/mail/MAIL_SETUP.md`](../takkas-backend/deploy/mail/MAIL_SETUP.md)
- [ ] Firebase **`com.passla.app`** → [`FIREBASE_PRODUCTION.md`](FIREBASE_PRODUCTION.md)
- [ ] `bash deploy/scripts/generate-env.sh api.passla.com.tr`
- [ ] `curl https://api.passla.com.tr/actuator/health` → UP

## Faz 2 — EAS / kapalı test

- [ ] `cd bex && npx eas login && npx eas init`
- [ ] `.\scripts\setup-eas-secrets.ps1 -ApiDomain api.passla.com.tr`
- [ ] `npm run build:preview:android` (veya `preview-phone`)
- [ ] Uçtan uca test → [`PREVIEW_TEST.md`](PREVIEW_TEST.md)

## Faz 3 — Mağaza listing

### Play Store — [`PLAY_STORE.md`](PLAY_STORE.md)

- [ ] App oluştur (`com.passla.app`)
- [ ] Store listing + data safety + content rating
- [ ] Internal testing track

### App Store — [`APP_STORE.md`](APP_STORE.md)

- [ ] App ID + App Store Connect app
- [ ] `bex/eas.json` → `appleId`, `ascAppId`

## Faz 4 — Build & Submit

- [ ] `npm run build:production`
- [ ] `npm run submit:android` + `npm run submit:ios`

## Faz 5 — Yayın sonrası

- [ ] Play internal → production
- [ ] TestFlight → Submit for Review
- [ ] [`POST_LAUNCH.md`](POST_LAUNCH.md)

---

**Hızlı komutlar**

```bash
cd takkas-backend && bash deploy/scripts/generate-env.sh api.passla.com.tr
cd bex && .\scripts\setup-eas-secrets.ps1 -ApiDomain api.passla.com.tr
curl https://api.passla.com.tr/actuator/health
```
