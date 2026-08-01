# BEX Mobil — EAS Production Build

## 1. EAS projesini bağla

```bash
cd bex
npm install
npx eas login
npx eas init
```

`eas init` sonrası `app.json` → `extra.eas.projectId` otomatik eklenir.

## 2. Production secrets

```bash
eas secret:create --name EXPO_PUBLIC_API_BASE_URL --value https://api.bex.app
eas secret:create --name EXPO_PUBLIC_EAS_PROJECT_ID --value <project-id>
# Firebase değişkenlerini de ekle ( .env.production.example listesine bak )
```

Secrets listesi: `eas secret:list`

## 3. Preview build (internal test)

```bash
npm run build:preview:android   # APK — telefona direkt yükle
```

## 4. Production build

```bash
npm run build:production
# veya
eas build --profile production --platform android
eas build --profile production --platform ios
```

`eas.json` production profili:
- `autoIncrement: true` — build numarası otomatik artar
- `APP_VARIANT=production`

## 5. Version bump (store güncellemesi)

`app.json` → `expo.version` (örn. 1.0.0 → 1.0.1)

## 6. Submit

```bash
npm run submit:android
npm run submit:ios
```

Detay: [`docs/PLAY_STORE.md`](../docs/PLAY_STORE.md), [`docs/APP_STORE.md`](../docs/APP_STORE.md)
