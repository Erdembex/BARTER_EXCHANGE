# Sanal POS (İyzico) entegrasyon rehberi

## Mevcut durum

- Varsayılan: `APP_PAYMENT_PROVIDER=manual` → admin panelden manuel onay
- İyzico iskelet: `IyzicoPaymentGateway.java` — `APP_PAYMENT_PROVIDER=iyzico` ile aktif olur

## Başvuru adımları (paralel)

1. Şahıs şirketi veya limited şirket kur
2. Vergi levhası al
3. https://www.iyzico.com → İşletme başvurusu
4. Sandbox API anahtarları (test) → production anahtarları (canlı)

## Backend env

```bash
APP_PAYMENT_PROVIDER=iyzico
IYZICO_API_KEY=sandbox-xxx
IYZICO_SECRET_KEY=sandbox-xxx
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com   # production: https://api.iyzipay.com
BASE_URL=https://api.bex.app
```

## Tam entegrasyon için yapılacaklar

1. `pom.xml` → İyzico Java SDK dependency
2. `IyzicoPaymentGateway.startCheckout()` → CheckoutFormInitialize API
3. Webhook controller: `POST /api/webhooks/iyzico` → ödeme onayı
4. Mobil abonelik ekranı → `redirectUrl` WebView / InAppBrowser
5. Sandbox test kartları ile uçtan uca test
6. Production key'ler + `IYZICO_BASE_URL=https://api.iyzipay.com`

## Manuel moda geri dön

```bash
APP_PAYMENT_PROVIDER=manual
```

Restart — `ManualPaymentGateway` tekrar `@Primary` olur.
