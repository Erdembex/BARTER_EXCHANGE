# Passla — Statik Web Sitesi

Mağaza yayını için **gizlilik politikası** ve **destek** sayfaları.

## Dosyalar

| Dosya | URL |
|-------|-----|
| `index.html` | `https://passla.com.tr/` |
| `gizlilik.html` | `https://passla.com.tr/gizlilik.html` |
| `destek.html` | `https://passla.com.tr/destek.html` |

Play Store / App Store gizlilik URL'si: **`https://passla.com.tr/gizlilik.html`**

## Cloudflare + Oracle (önerilen)

1. Cloudflare Free → [`docs/CLOUDFLARE_SETUP.md`](../docs/CLOUDFLARE_SETUP.md)
2. Natro'da sadece nameserver değiştir
3. Cloudflare A kayıtları: `@` + `api` → `150.230.158.219`

Sunucuda (repo clone sonrası):

```bash
cd BARTER_EXCHANGE/takkas-backend
sudo bash deploy/scripts/setup-passla-production.sh passla.com.tr
```

Sadece statik site (SSL sonra):

```bash
sudo bash deploy/scripts/setup-passla-website.sh passla.com.tr
```

## Lokal test

```bash
cd website
npx serve .
# http://localhost:3000/gizlilik.html
```

## Uygulama eşleştirme

- [`bex/app.json`](../bex/app.json) → `privacyPolicyUrl`: `https://passla.com.tr/gizlilik.html`
- Destek e-postası: `destek@passla.com.tr`
