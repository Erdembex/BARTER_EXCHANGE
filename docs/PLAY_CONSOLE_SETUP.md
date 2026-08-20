# Google Play Console — Adım Adım Kurulum (Passla)

Package name: **`com.passla.app`**

## 1. Uygulama oluştur

1. https://play.google.com/console → **Create app**
2. App name: **Passla**
3. Default language: **Turkish**
4. App or game: App
5. Free or paid: Free

## 2. Store listing

Main store listing → metinler: [`bex/store-listing/play-store-tr.txt`](../bex/store-listing/play-store-tr.txt)

| Alan | Değer |
|------|-------|
| App icon | 512×512 PNG ([`bex/assets/icon.png`](../bex/assets/icon.png)) |
| Feature graphic | 1024×500 (önerilir) |
| Phone screenshots | Min 2 |
| Privacy policy | `https://passla.com.tr/gizlilik.html` |

## 3. App content (zorunlu formlar)

1. **Privacy policy** — `https://passla.com.tr/gizlilik.html`
2. **Ads** — Reklam yoksa "No"
3. **Content rating** — IARC anketi
4. **Target audience** — 13+
5. **Data safety** — Konum, kamera, fotoğraf, mesajlaşma

## 4. Internal testing

1. Release → Testing → Internal testing → Create release
2. EAS APK/AAB yükle
3. Testers → e-posta listesi

```powershell
cd bex
npx eas build --profile preview-phone --platform android
# veya production
npm run build:production:android
```

## 5. Service account (EAS submit)

1. Google Cloud → Service Accounts → JSON key
2. Play Console → API access → Link
3. `bex/google-play-service-account.json`
4. Doğrula: `bash bex/scripts/verify-play-service-account.sh`

## 6. Production'a geçiş

Internal test OK → Closed testing (opsiyonel) → Production

[`STORE_LAUNCH_CHECKLIST.md`](STORE_LAUNCH_CHECKLIST.md)
