# Passla — Preview APK / Uçtan Uca Test

Backend: `http://150.230.158.219` (Nginx → Spring Boot)  
Production (DNS + SSL sonrası): `https://api.passla.com.tr`

## Otomatik kontrol (PC)

```powershell
cd C:\Users\ERDEM\Desktop\BEX_CURSOR
.\scripts\verify-production-api.ps1
```

## Build al

```powershell
cd bex
# Telefon test (Oracle IP)
npx eas build --profile preview-phone --platform android

# veya mevcut build
npx eas build:list --platform android --limit 1
```

APK indir → telefona kur (Bilinmeyen kaynaklara izin ver).

## Manuel test checklist

| # | Test | Beklenen |
|---|------|----------|
| 1 | Uygulama açılışı | “Sunucuya bağlanılamadı” banner **yok** |
| 2 | Bireysel kayıt | Hesap oluşur, ana ekrana geçer |
| 3 | Çıkış + giriş | Token ile giriş OK |
| 4 | Görev listesi | Liste yüklenir (boş olabilir) |
| 5 | Profil → il/ilçe | Görünür |
| 6 | Profil → ön yazı (bio) | Kaydedilir, public profilde görünür |
| 7 | Profil → CV (PDF, opsiyonel) | Yüklenir / kaldırılır |
| 8 | Görev tamamlama → puan | Yıldız **zorunlu**, yorum opsiyonel |
| 9 | Puan vermeden çıkış | Tekrar girişte modal engeller |
| 10 | Fotoğraf yükleme | Hata yok (local storage) |
| 11 | Mesajlaşma | WebSocket bağlanır |
| 12 | Push bildirimi | **Beklenen: çalışmaz** (Firebase SA yok) |

## Sorun giderme

```powershell
ssh -i C:\Users\ERDEM\Downloads\ssh-key-2026-08-06.key ubuntu@150.230.158.219 "journalctl -u takkas -n 80 --no-pager"
```

| Belirti | Olası neden |
|---------|-------------|
| Sunucu banner | API URL / cleartext / firewall |
| 401 kayıt sonrası | JWT / saat farkı |
| Upload hata | `/var/takkas/uploads` izinleri |
| Mesaj gitmiyor | Nginx WebSocket proxy |
| Puan modal çıkmıyor | Backend deploy + pending-feedback API |
