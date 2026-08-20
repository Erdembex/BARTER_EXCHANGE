# App Store Connect — Adım Adım Kurulum (Passla)

Bundle ID: **`com.passla.app`**

## 1. Apple Developer — App ID

1. https://developer.apple.com/account → **Certificates, Identifiers & Profiles**
2. Identifiers → **+** → App IDs → App
3. Description: Passla
4. Bundle ID: **Explicit** → `com.passla.app`
5. Capabilities: Push Notifications

## 2. App Store Connect — Uygulama

1. https://appstoreconnect.apple.com → **My Apps → + → New App**
2. Platforms: iOS
3. Name: **Passla**
4. Primary language: Turkish
5. Bundle ID: `com.passla.app`
6. SKU: `passla-app`

## 3. Store listing

- Metinler: [`bex/store-listing/app-store-tr.txt`](../bex/store-listing/app-store-tr.txt)
- Gizlilik: `https://passla.com.tr/gizlilik.html`
- Destek: `https://passla.com.tr/destek.html`

## 4. eas.json

`bex/eas.json` → `submit.production.ios`:
- `appleId`: Apple ID e-postan
- `ascAppId`: App Store Connect sayısal ID

## 5. TestFlight

```powershell
cd bex
npx eas build --profile production --platform ios
npm run submit:ios
```

[`APP_STORE.md`](APP_STORE.md) · [`STORE_LAUNCH_CHECKLIST.md`](STORE_LAUNCH_CHECKLIST.md)
