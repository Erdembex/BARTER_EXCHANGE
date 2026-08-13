# BEX — Statik Web Sitesi

Mağaza yayını için gerekli **gizlilik politikası** ve **destek** sayfaları.

## Dosyalar

| Dosya | URL (domain kökünde) |
|-------|----------------------|
| `index.html` | `https://SENIN-DOMAIN/` |
| `gizlilik.html` | `https://SENIN-DOMAIN/gizlilik` veya `/gizlilik.html` |
| `destek.html` | `https://SENIN-DOMAIN/destek` |

Play Store / App Store için gizlilik URL'si: **`https://SENIN-DOMAIN/gizlilik.html`**

## Cloudflare Pages ile yayınlama (ücretsiz)

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages → Create project
2. Connect to Git → bu repo → Build settings:
   - **Framework preset:** None
   - **Build command:** (boş)
   - **Build output directory:** `website`
3. Custom domain: `bex.app` (veya aldığınız domain)
4. `_redirects` dosyası `/gizlilik` → `gizlilik.html` yönlendirmesini sağlar

## Domain almadan önce test

```bash
cd website
npx serve .
# http://localhost:3000/gizlilik.html
```

## Özelleştirme

Domain farklıysa HTML içindeki `destek@bex.app` e-postasını güncelleyin.
`bex/app.json` → `extra.privacyPolicyUrl` değerini gerçek URL ile eşleştirin.
