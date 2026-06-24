# Eklenmesi Gerekenler — Durum

## Tamamlandı

### 1. İnternet Kesintisi Uyarısı (Offline Handling)
- `useNetwork` hook + `OfflineBanner` → root layout

### 2. Başvuru İptal Mekanizması
- `cancelled` status + `/application/[id]` detay ekranı + Toast

### 3. İşletme Doğrulama (KYC)
- `/(business)/verification` + `expo-document-picker` + Firebase Storage

### 4. Kupon Kullanım Audit
- `usageHistory`: `usedAt` + `scannedBy` (işletme kullanıcı uid)
