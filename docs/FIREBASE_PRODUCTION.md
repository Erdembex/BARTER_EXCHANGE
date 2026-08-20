# Firebase Production Kurulumu — Passla

## 1. Proje ve uygulamalar

1. [Firebase Console](https://console.firebase.google.com) → proje seç veya oluştur
2. **Project settings** → General → Your apps

### Android

- Add app → Android
- Package name: **`com.passla.app`**
- `google-services.json` gerekmez (Expo managed workflow — config EAS secrets ile)

### iOS

- Add app → iOS
- Bundle ID: **`com.passla.app`**

## 2. Web config değerleri (EAS secrets)

Project settings → General → Web app (yoksa ekle) → Config:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
```

EAS'e yükle:

```powershell
cd bex
.\scripts\setup-eas-secrets.ps1 -ApiDomain api.passla.com.tr
```

## 3. Cloud Messaging (Push)

1. Project settings → Cloud Messaging
2. **Service accounts** → Generate new private key → `firebase-sa.json`
3. Sunucuya kopyala:

```bash
scp -i key.pem firebase-sa.json ubuntu@150.230.158.219:/opt/takkas/firebase-sa.json
```

4. `/opt/takkas/.env`:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=/opt/takkas/firebase-sa.json
```

5. `sudo systemctl restart takkas`

## 4. App Check (opsiyonel, önerilir)

1. Firebase → App Check → Register apps
2. Play Integrity (Android) + App Attest (iOS)
3. EAS build'de App Check token backend'e gönderilir

## 5. Doğrulama

- Uygulama açılışında FCM token kaydı (backend log)
- Test push bildirimi
- App Check enforcement production'da açılabilir

## Eski paket adı

`com.bex.app` kayıtlı uygulamalar varsa silmeyin; yeni **`com.passla.app`** ekleyin.
Production build yalnızca yeni paket adını kullanır.
