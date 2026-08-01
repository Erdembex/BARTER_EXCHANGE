# App Store Yayın Rehberi

## Ön koşullar

- [ ] Apple Developer Program (~99 USD/yıl)
- [ ] Production backend: `https://api.bex.app`
- [ ] EAS production build hazır
- [ ] Gizlilik politikası URL'si

## 1. App Store Connect

1. https://appstoreconnect.apple.com → My Apps → New App
2. Platform: iOS
3. Name: BEX
4. Bundle ID: **`com.bex.app`**
5. SKU: `bex-app`
6. Primary language: Turkish

## 2. Store listing

| Alan | Gereksinim |
|------|------------|
| Ekran görüntüleri | 6.7", 6.5", 5.5" iPhone boyutları |
| Açıklama | TR (+ EN opsiyonel) |
| Anahtar kelimeler | görev, ödül, kupon, beceri |
| Destek URL | https://bex.app |
| Gizlilik politikası | https://bex.app/gizlilik |

## 3. App Privacy

Bildirilecek veri türleri:

- Konum (yakındaki görevler)
- Fotoğraflar (görev teslimi, sohbet)
- Kamera (QR kupon okuma)
- Kullanıcı kimliği (hesap)

`ITSAppUsesNonExemptEncryption: false` — export compliance sorunu yok (`bex/app.json`).

## 4. eas.json ayarları

`bex/eas.json` içinde gerçek değerler:

```json
"ios": {
  "appleId": "senin@email.com",
  "ascAppId": "1234567890"
}
```

`ascAppId`: App Store Connect → App Information → Apple ID

## 5. Build ve submit

```bash
cd bex
npx eas login
eas build --profile production --platform ios
eas submit --platform ios --profile production
```

İlk build'de Apple hesap bilgileri sorulur; EAS sertifikaları otomatik yönetir.

## 6. TestFlight → Review

1. App Store Connect → TestFlight → Internal Testing
2. Build'i internal test grubuna ekle
3. Test tamam → Submit for Review
4. Apple inceleme: genelde 1–3 gün (ilk submission daha uzun)

## Checklist

- [ ] Bundle ID `com.bex.app` eşleşiyor
- [ ] Production API URL EAS secret'ta
- [ ] App Privacy anketi tamamlandı
- [ ] Ekran görüntüleri yüklendi
- [ ] TestFlight internal test geçti
