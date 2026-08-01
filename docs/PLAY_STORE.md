# Google Play Store Yayın Rehberi

## Ön koşullar

- [ ] Google Play Console geliştirici hesabı (~25 USD)
- [ ] Production backend: `https://api.bex.app`
- [ ] EAS production build hazır
- [ ] Gizlilik politikası: `https://bex.app/gizlilik`

## 1. Play Console uygulama oluştur

1. https://play.google.com/console → Create app
2. Package name: **`com.bex.app`** (`bex/app.json` ile aynı olmalı)
3. App name: BEX
4. Default language: Turkish

## 2. Store listing

| Alan | İçerik |
|------|--------|
| Kısa açıklama | Görev yap, ödül kazan |
| Uzun açıklama | TR + EN |
| Ekran görüntüleri | Telefon (min 2), tablet (opsiyonel) |
| Uygulama ikonu | 512x512 PNG |
| Gizlilik politikası | https://bex.app/gizlilik |
| İçerik derecelendirme | Anketi doldur |
| Veri güvenliği | Konum, kamera, fotoğraf bildir |

## 3. Service account (EAS submit)

1. Google Cloud Console → IAM → Service Accounts → Create
2. Play Console → Setup → API access → Link service account
3. Rol: Release manager
4. JSON key indir → `bex/google-play-service-account.json` (git'e ekleme!)
5. `.gitignore`'da olduğundan emin ol

## 4. eas.json ayarları

`bex/eas.json` içinde:

```json
"android": {
  "serviceAccountKeyPath": "./google-play-service-account.json",
  "track": "internal"
}
```

İlk test: `internal` track. Onay sonrası `production`'a promote et.

## 5. Build ve submit

```bash
cd bex
npm run build:production
eas submit --platform android --profile production
```

## 6. İnceleme

- Internal test: birkaç saat
- Production review: 1–7 gün

## Checklist

- [ ] Package name `com.bex.app` eşleşiyor
- [ ] versionCode EAS tarafından artırılıyor (`autoIncrement: true`)
- [ ] Production API URL EAS secret'ta
- [ ] Veri güvenliği formu tamamlandı
- [ ] İçerik derecelendirme tamamlandı
