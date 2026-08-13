# Preview APK — Uçtan Uca Test

Backend: `http://150.230.158.219` (Nginx → Spring Boot)

## Otomatik kontrol (PC)

```powershell
cd C:\Users\ERDEM\Desktop\BEX_CURSOR
.\scripts\verify-production-api.ps1
```

## Build durumu

```powershell
cd bex
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
| 5 | Profil | İl/ilçe görünür |
| 6 | Fotoğraf yükleme (görev/ profil) | Hata yok (local storage) |
| 7 | Mesajlaşma | WebSocket bağlanır |
| 8 | Push bildirimi | **Beklenen: çalışmaz** (Firebase SA yok) |

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
