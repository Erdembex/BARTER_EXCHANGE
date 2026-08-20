# eas.json — Submit ayarları

Production submit öncesi [`eas.json`](../eas.json) içindeki placeholder'ları doldur:

## iOS

```json
"ios": {
  "appleId": "senin-apple-id@email.com",
  "ascAppId": "1234567890"
}
```

- `appleId`: Apple Developer hesap e-postası
- `ascAppId`: App Store Connect → App Information → Apple ID (sayısal)

## Android

```json
"android": {
  "serviceAccountKeyPath": "./google-play-service-account.json",
  "track": "internal"
}
```

- JSON key: Play Console → API access → Service account
- İlk test: `internal` → sonra `production`

Doğrulama: `npm run store:verify-play`

Detay: [`docs/PLAY_CONSOLE_SETUP.md`](../../docs/PLAY_CONSOLE_SETUP.md), [`docs/APP_STORE_CONNECT_SETUP.md`](../../docs/APP_STORE_CONNECT_SETUP.md)
