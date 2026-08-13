# Website — Cloudflare Pages

Statik dosyalar: [`website/`](../website/)

## Hizli deploy

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Pages** → Create project
2. Connect Git → repo: `BARTER_EXCHANGE` (veya sadece `website/` klasoru)
3. Build settings:
   - Framework: **None**
   - Build command: *(bos)*
   - Output directory: **`website`**
4. Custom domain: **`barterex.com.tr`**
5. DNS A kaydi VM IP'sine (Reserved IP onerilir)

## Domain almadan test

```powershell
cd website
npx serve .
# http://localhost:3000/gizlilik.html
```

## Eslestirme

| Dosya | URL |
|-------|-----|
| [`bex/app.json`](../bex/app.json) `privacyPolicyUrl` | `https://barterex.com.tr/gizlilik.html` |
| [`store-listing/metadata.json`](../bex/store-listing/metadata.json) | ayni |

Deploy sonrasi:

```powershell
curl.exe -sS -o NUL -w "%{http_code}" https://barterex.com.tr/gizlilik.html
```
