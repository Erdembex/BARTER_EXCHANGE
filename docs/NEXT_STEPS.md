# Passla — Sıradaki Adımlar (Otomatik / Senin Yapacakların)

**Bugün odak:** Kapalı test APK → hesaplar → DNS kararı → production altyapı

---

## Otomatik / agent tarafı (devam ediyor)

- [x] Backend Oracle'da ayakta (V29, bio/CV/puan)
- [x] Ana sayfa başlık yanıp sönme düzeltildi
- [x] `start-dev-session.ps1` düzeltildi
- [x] EAS giriş: `erdem1803`
- [ ] **preview-phone APK** build (`npm run build:preview-phone:android`)

APK hazır olunca: Expo dashboard'dan indir → telefona kur → [`PREVIEW_TEST.md`](PREVIEW_TEST.md)

---

## Senin yapman gerekenler (sırayla, DNS beklerken bile)

### A. İlk kez — test APK (5 dk, senin terminalinde)

PowerShell:

```powershell
cd C:\Users\ERDEM\Desktop\BEX_CURSOR
.\scripts\build-preview-phone.ps1
```

İlk seferde **“Generate new keystore?”** → **Yes** de.  
Build bitince https://expo.dev → APK indir → telefona kur.

### B. Ücretsiz / düşük maliyet (bu hafta)

| # | Ne | Link | Süre |
|---|-----|------|------|
| 1 | **AWS hesabı** + S3 bucket `passla-media-prod` | https://aws.amazon.com | ~30 dk |
| 2 | **SendGrid** ücretsiz hesap + API key | https://sendgrid.com | ~15 dk |
| 3 | **Firebase** → Android/iOS `com.passla.app` ekle | https://console.firebase.google.com | ~20 dk |
| 4 | **Google Play Console** (~25 USD) | https://play.google.com/console | 1–2 gün onay |

Detay: [`ACCOUNTS_SETUP.md`](ACCOUNTS_SETUP.md) · [`PRODUCTION_INFRA.md`](PRODUCTION_INFRA.md)

### C. Cloudflare DNS (Natro'da sadece nameserver)

1. Cloudflare Free hesap → site ekle `passla.com.tr`
2. Natro → **DNS Değiştir** → Cloudflare NS yapıştır ([`NATRO_DNS.md`](NATRO_DNS.md))
3. Cloudflare DNS: A `@` + A `api` → `150.230.158.219` (**DNS only**, gri bulut)
4. `.\scripts\verify-passla-dns.ps1` → OK
5. `.\scripts\deploy-passla-website-oracle.ps1` → SSL + gizlilik sitesi

Detay: [`CLOUDFLARE_SETUP.md`](CLOUDFLARE_SETUP.md)

### D. Hesaplar hazır olunca (agent sunucuya bağlar)
```powershell
# S3 + SendGrid değerlerini .env'e yazdıktan sonra
.\scripts\deploy-backend-oracle.ps1
```

Sunucuda: Firebase SA → `/opt/takkas/firebase-sa.json`

---

## Özellik durumu (kısa)

| Özellik | Şimdi | Production için |
|---------|--------|-----------------|
| Kayıt / giriş | ✅ | ✅ |
| Fotoğraf / CV | Sunucu diski | **AWS S3** |
| Şifre sıfırlama maili | Log only | **SendGrid** |
| Telefon SMS kodu | Dev (SMS gitmiyor) | Netgsm/Twilio (sonra) |
| Push bildirim | ❌ | **Firebase SA** |
| TC kimlik doğrulama | ❌ yok | İsteğe bağlı, ayrı proje |
| İşletme KYC | ✅ admin onay | ✅ |

---

## Komutlar (PC)

```powershell
# Geliştirme oturumu
.\scripts\start-dev-session.ps1 -StartExpo

# Backend kontrol
.\scripts\verify-production-api.ps1

# Test APK build
cd bex
npm run build:preview-phone:android
```

---

**Sonraki agent adımı:** APK build tamamlanınca test checklist + Play Internal test hazırlığı.
