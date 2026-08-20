# Google Play Store Yayın Rehberi — Passla

## Ön koşullar

- [ ] Google Play Console geliştirici hesabı (~25 USD)
- [ ] Production backend: `https://api.passla.com.tr`
- [ ] EAS production build hazır
- [ ] Gizlilik politikası: `https://passla.com.tr/gizlilik.html`

## 1. Play Console uygulama oluştur

1. https://play.google.com/console → Create app
2. Package name: **`com.passla.app`** (`bex/app.json` ile aynı olmalı)
3. App name: **Passla**
4. Default language: Turkish

## 2. Store listing

Metinler: [`bex/store-listing/play-store-tr.txt`](../bex/store-listing/play-store-tr.txt)

| Alan | İçerik |
|------|--------|
| Kısa açıklama | Görev yap, ödül kazan |
| Uzun açıklama | TR + EN |
| Ekran görüntüleri | Telefon (min 2), tablet (opsiyonel) |
| Uygulama ikonu | 512x512 PNG |
| Gizlilik politikası | https://passla.com.tr/gizlilik.html |
| İçerik derecelendirme | Anketi doldur |
| Veri güvenliği | Konum, kamera, fotoğraf bildir |

## 3. Internal testing (kapalı beta)

1. Release → Testing → Internal testing
2. `npm run build:production:android` veya `preview-phone`
3. Test kullanıcı e-posta listesi ekle
4. Detay: [`PLAY_CONSOLE_SETUP.md`](PLAY_CONSOLE_SETUP.md)

## 4. Service account (EAS submit)

1. Google Cloud Console → IAM → Service Accounts → Create
2. Play Console → Setup → API access → Link service account
3. JSON key → `bex/google-play-service-account.json` (git'e ekleme!)

## 5. Build ve submit

```powershell
cd bex
npm run build:production:android
npm run submit:android
```

## Checklist

- [ ] Package name `com.passla.app` eşleşiyor
- [ ] Production API URL EAS secret'ta (`https://api.passla.com.tr`)
- [ ] Veri güvenliği formu tamamlandı
- [ ] İçerik derecelendirme tamamlandı
- [ ] Min 2 ekran görüntüsü yüklendi
