# App Store Yayın Rehberi — Passla

## Ön koşullar

- [ ] Apple Developer Program (~99 USD/yıl)
- [ ] Production backend: `https://api.passla.com.tr`
- [ ] Gizlilik: `https://passla.com.tr/gizlilik.html`

## 1. App Store Connect

1. https://appstoreconnect.apple.com → My Apps → New App
2. Platform: iOS
3. Name: **Passla**
4. Bundle ID: **`com.passla.app`**
5. SKU: `passla-app`
6. Primary language: Turkish

## 2. Store listing

Metinler: [`bex/store-listing/app-store-tr.txt`](../bex/store-listing/app-store-tr.txt)

| Alan | Gereksinim |
|------|------------|
| Ekran görüntüleri | 6.7", 6.5", 5.5" iPhone |
| Destek URL | https://passla.com.tr/destek.html |
| Gizlilik politikası | https://passla.com.tr/gizlilik.html |

## 3. TestFlight

```powershell
cd bex
npx eas build --profile production --platform ios
npm run submit:ios
```

Detay: [`APP_STORE_CONNECT_SETUP.md`](APP_STORE_CONNECT_SETUP.md)

## Checklist

- [ ] Bundle ID `com.passla.app` eşleşiyor
- [ ] App Privacy formu tamamlandı
- [ ] TestFlight internal test OK
