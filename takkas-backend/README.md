# Takkas Backend

Hizmet karşılığı ayrıcalık platformu — paranın olmadığı iş takası.

## Teknolojiler

- Java 21 + Spring Boot 3.3
- PostgreSQL 16
- Redis 7
- Firebase Cloud Messaging (push notification)
- Stripe (abonelik / ödeme)
- WebSocket (STOMP — gerçek zamanlı mesajlaşma)

## Kurulum

### 1. Gereksinimleri başlat

```bash
docker-compose up -d
```

### 2. Ortam değişkenlerini ayarla

```bash
cp .env.example .env
# .env dosyasını doldur
```

### 3. Firebase Service Account

Firebase Console'dan indirdiğin `service-account.json` dosyasını
proje köküne koy ve `.env` dosyasına ekle:

```
FIREBASE_SERVICE_ACCOUNT_PATH=./service-account.json
```

### 4. Uygulamayı çalıştır

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

## Modüller

| Modül | Açıklama |
|---|---|
| auth | JWT, refresh token, kayıt/giriş |
| user | İşletme ve bireysel profiller |
| listing | İş ilanları |
| application | Başvuru akışı |
| coupon | Kupon yaşam döngüsü, QR doğrulama |
| messaging | WebSocket pazarlık konuşmaları |
| swap | Kupon takas pazarı |
| subscription | Plan yönetimi, Stripe entegrasyonu |
| notification | In-app + push bildirimler |

## Script Çalıştırma Sırası

```bash
chmod +x *.sh
./00_setup.sh
./01_common.sh
./02_auth.sh
./03_user.sh
./04_listing.sh
./05_application.sh
./06_coupon.sh
./07_messaging.sh
./08_swap.sh
./09_subscription.sh
./10_notification.sh
./11_infrastructure.sh
```

## IntelliJ'de Açma

1. `File → Open → takkas-backend` klasörünü seç
2. Maven projesi olarak tanıyacak, bağımlılıkları indirecek
3. `TakkasApplication` sınıfını çalıştır

## Ortam Değişkenleri

| Değişken | Açıklama |
|---|---|
| DB_URL | PostgreSQL bağlantı URL |
| DB_USER | DB kullanıcı adı |
| DB_PASS | DB şifresi |
| REDIS_HOST | Redis host |
| JWT_SECRET | JWT imzalama anahtarı (min 32 karakter) |
| STRIPE_SECRET_KEY | Stripe gizli anahtar |
| STRIPE_WEBHOOK_SECRET | Stripe webhook doğrulama |
| FIREBASE_SERVICE_ACCOUNT_PATH | Firebase service account JSON yolu |
