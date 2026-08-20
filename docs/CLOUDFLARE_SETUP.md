# Passla — Cloudflare DNS + SSL (Natro sadece domain)

Domain **passla.com.tr** Natro'dan alındı. **DNS yönetimi Cloudflare'de** (ücretsiz).  
Natro'da ücretli “Profesyonel DNS” **almana gerek yok**.

---

## Genel akış

```
Natro  →  sadece nameserver'ları Cloudflare'e yönlendir
Cloudflare  →  A kayıtları (@ + api)
Oracle sunucu  →  gizlilik sitesi + API + SSL (certbot)
```

---

## Adım 1 — Cloudflare hesabı (PC, ~10 dk)

1. https://dash.cloudflare.com/sign-up → ücretsiz hesap aç
2. **Add a site** → `passla.com.tr` yaz
3. Plan: **Free** seç
4. Cloudflare sana **2 nameserver** verir, örneğin:
   - `ada.ns.cloudflare.com`
   - `bob.ns.cloudflare.com`  
   (Seninkiler farklı olacak — ekrandakileri kopyala)

---

## Adım 2 — Natro'da sadece nameserver değiştir (~5 dk)

Natro panelinde gördüğün ekranda:

1. **passla.com.tr** → domain yönetimi
2. **DNS Değiştir** (yeşil link) — **buna bas**
3. Natro nameserver'larını sil / Cloudflare'in verdiği **2 adresi** yapıştır
4. Kaydet

**Basma:**
- Profesyonel DNS / Siparişe Ekle
- Hosting Satın Al
- Natro'da A kaydı ekleme (artık Cloudflare'de yapacaksın)

Yayılma: **15 dk – 24 saat** (genelde 1–2 saat)

---

## Adım 3 — Cloudflare DNS kayıtları

Cloudflare → **passla.com.tr** → **DNS** → **Records**

Mevcut kayıtları temizle (park sayfası IP'si varsa sil). Ekle:

| Type | Name | Content | Proxy status |
|------|------|---------|--------------|
| **A** | `@` | `150.230.158.219` | **DNS only** (gri bulut) |
| **A** | `api` | `150.230.158.219` | **DNS only** (gri bulut) |

**Önemli:** İlk kurulumda **turuncu bulut (Proxied) KAPALI** olsun.  
Böylece Oracle'da Let's Encrypt SSL ve WebSocket sorunsuz çalışır.

---

## Adım 4 — Doğrula (PC)

```powershell
cd C:\Users\ERDEM\Desktop\BEX_CURSOR
.\scripts\verify-passla-dns.ps1
```

Her iki satır **yeşil [OK]** olmalı.

---

## Adım 5 — SSL + site (DNS hazır olunca)

PowerShell:

```powershell
.\scripts\deploy-passla-website-oracle.ps1
```

Bu script:
- `website/` dosyalarını Oracle'a yükler
- nginx + **certbot SSL** kurar
- `https://passla.com.tr/gizlilik.html` ve `https://api.passla.com.tr` açar

Manuel kontrol:

```powershell
Invoke-RestMethod https://api.passla.com.tr/actuator/health
```

Tarayıcı: https://passla.com.tr/gizlilik.html

---

## SendGrid (sonra, aynı Cloudflare DNS'te)

SendGrid domain doğrulaması CNAME kayıtları ister → Cloudflare DNS'e eklersin (SendGrid panelinden kopyala).

---

## Sorun giderme

| Belirti | Çözüm |
|---------|--------|
| Hâlâ Natro park sayfası | Nameserver yayılmasını bekle; `nslookup passla.com.tr` Cloudflare NS göstermeli |
| SSL hata | A kayıtları **DNS only** (gri) mi kontrol et |
| API 502 | Oracle backend: `curl http://150.230.158.219/actuator/health` |
| verify-passla-dns kırmızı | 1–2 saat daha bekle |

---

## Özet — Natro'da tek iş

**DNS Değiştir** → Cloudflare nameserver'ları yapıştır → **bitti**.  
A kayıtları, SSL, site — hepsi Cloudflare + Oracle tarafında.
