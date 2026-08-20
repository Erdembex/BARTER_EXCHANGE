# Oracle — Sabit Public IP (Reserved)

Ephemeral IP VM yeniden baslatilinca degisebilir. Domain DNS ve mobil API URL icin **Reserved Public IP** kullan.

## Adimlar (Console)

1. **Networking → IP Management → Reserved Public IP Addresses**
2. **Reserve Public IP Address**
   - Compartment: root
   - IP version: IPv4
3. **Compute → Instances → takkas-backend**
4. Attached VNIC → Primary VNIC → **IPv4 Addresses**
5. Public IP Type: **Reserved public IP** → olusturdugun IP'yi sec
6. Kaydet

## DNS

Domain saglayicinda:

| Tip | Host | Deger |
|-----|------|-------|
| A | `@` | Reserved IP |
| A | `api` | Reserved IP |

Sonra:

```bash
cd BARTER_EXCHANGE/takkas-backend
sudo bash deploy/scripts/setup-passla-production.sh passla.com.tr
```

## IP degisirse

- [`bex/eas.json`](../bex/eas.json) `EXPO_PUBLIC_API_BASE_URL`
- [`bex/.env.local`](../bex/.env.local)
- Oracle Security List ayni kalir (yeni IP'ye otomatik bagli)
