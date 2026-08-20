# Passla — Gizlilik Sitesi Deploy

Statik dosyalar: [`website/`](../website/)

## Oracle VM (önerilen — domain ile aynı sunucu)

DNS (Natro):
- `@` → `150.230.158.219`
- `api` → `150.230.158.219`

Windows'tan deploy:

```powershell
.\scripts\deploy-passla-website-oracle.ps1
```

Sunucuda manuel:

```bash
cd BARTER_EXCHANGE/takkas-backend
sudo bash deploy/scripts/setup-passla-production.sh passla.com.tr
```

## Doğrulama

| URL | Beklenen |
|-----|----------|
| `https://passla.com.tr/gizlilik.html` | 200, Passla metni |
| `https://passla.com.tr/destek.html` | 200 |
| `https://api.passla.com.tr/actuator/health` | `{"status":"UP"}` |

PowerShell:

```powershell
Invoke-WebRequest https://passla.com.tr/gizlilik.html -Method Head
Invoke-RestMethod https://api.passla.com.tr/actuator/health
```

## Uygulama eşleştirme

| Dosya | Değer |
|-------|-------|
| [`bex/app.json`](../bex/app.json) | `privacyPolicyUrl`: `https://passla.com.tr/gizlilik.html` |
| [`bex/store-listing/metadata.json`](../bex/store-listing/metadata.json) | Passla URL'leri |

## DNS henüz yayılmadıysa

`nslookup passla.com.tr` → `150.230.158.219` olmalı.  
Natro park sayfası (`85.159.x.x`) görüyorsan [`NATRO_DNS.md`](NATRO_DNS.md) adımlarını uygula.
