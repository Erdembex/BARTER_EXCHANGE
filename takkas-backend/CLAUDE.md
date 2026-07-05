# Takkas Backend — CLAUDE.md

## Proje Özeti
Hizmet karşılığı ayrıcalık platformu (Service-for-privilege barter platform).
- **Java 21 + Spring Boot 3.3**, PostgreSQL 16, Redis 7, Firebase Admin SDK, Stripe, WebSocket (STOMP)
- **Entry point**: `com.takkas.TakkasApplication` (@SpringBootApplication + @EnableJpaAuditing + @EnableScheduling + @EnableAsync)

---

## Çalıştırma

```bash
# Altyapı (PostgreSQL + Redis)
docker-compose up -d

# Uygulama
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

---

## Paket Yapısı

```
com/takkas/
├── common/
│   ├── config/          SecurityConfig, RedisConfig, WebSocketConfig, AsyncConfig
│   ├── event/           Domain olayları (ApplicationReceived, CouponIssued, SwapCompleted, ...)
│   ├── exception/       TakkasException (base), ResourceNotFoundException, BusinessRuleException,
│   │                    ForbiddenException, GlobalExceptionHandler
│   ├── pagination/      PageResponse<T>
│   └── security/        JwtTokenProvider, JwtAuthFilter, UserPrincipal, @CurrentUser
├── infrastructure/
│   ├── mail/            MailService (interface) + SmtpMailService
│   ├── push/            FcmPushService, FcmToken, FcmTokenRepository, FirebaseConfig,
│   │                    PushNotificationService (interface: sendAsync)
│   └── storage/         StorageService (interface) + S3StorageService
└── modules/             (her modül: domain/ api/ service/ repository/ mapper/)
    ├── auth/
    ├── user/
    ├── listing/
    ├── application/
    ├── coupon/
    ├── messaging/
    ├── swap/
    ├── subscription/
    └── notification/
```

---

## Modüller

| Modül | Sorumluluk | Önemli Sınıflar |
|-------|-----------|-----------------|
| **auth** | JWT/refresh token, kayıt, giriş | AuthController, RegisterService, LoginService, TokenRefreshService, RefreshToken |
| **user** | İşletme & bireysel profiller | UserController, UserService, User, BusinessProfile, IndividualProfile, UserFacade |
| **listing** | İlan CRUD, yayınlama, expiry zamanlayıcı | ListingController, ListingService, ListingQueryService, ListingExpiryScheduler |
| **application** | Başvuru al/kabul/red akışı | ApplicationController, ApplicationService, ApplicationQueryService |
| **coupon** | Kupon ömrü, QR doğrulama, takas validasyonu | CouponService, CouponVerifyService, CouponEventListener, CouponActivationListener |
| **messaging** | Gerçek zamanlı mesajlaşma + teklifler (WebSocket) | ConversationController, OfferService, MessageBufferService, MessageFlushScheduler |
| **swap** | Kupon pazar yeri, swap eşleştirme | SwapController, SwapListingService, SwapOfferService |
| **subscription** | Planlar, Stripe faturalandırma, feature-gate (Redis) | SubscriptionService, StripeService, FeatureGateService, StripeWebhookHandler |
| **notification** | Uygulama içi + push bildirimler (Firebase) | NotificationService, NotificationFactory, NotificationEventListener |

---

## Domain Modelleri (Özet)

### User / Profiller
```
User: id(UUID), email(unique), passwordHash, userType(BUSINESS|INDIVIDUAL), status(ACTIVE|SUSPENDED)
BusinessProfile: user(OneToOne), businessName, category(BusinessCategory), city, district, phone, logoUrl, bio, verified
IndividualProfile: user(OneToOne), fullName, city, district, avatarUrl, bio, skills(List<IndividualSkill>)
```

### Listing
```
Listing: business(ManyToOne→BusinessProfile), title, description, weeklyHours(WeeklyHours),
         status(DRAFT|ACTIVE|CLOSED|EXPIRED), viewCount, reward(ListingReward), skills(List),
         expiresAt
Methods: publish(), close(), expire(), isActive(), addSkill(), setReward()
```

### Application
```
Application: listingId(UUID), businessId(UUID), individual(ManyToOne→IndividualProfile),
             coverLetter(TEXT), status(PENDING|UNDER_REVIEW|ACCEPTED|REJECTED|WITHDRAWN)
Methods: markUnderReview(), accept(), reject(), withdraw(), isOwnedBy()
```

### Coupon
```
Coupon: applicationId(unique), ownerId, businessId, rewardType(RewardType), quantity, unit,
        description, qrToken(unique), status(DRAFT|ACTIVE|USED|EXPIRED|SWAPPED),
        validityDays, issuedAt, expiresAt, usedAt
Methods: activate(), markUsed(), expire(), markSwapped(), isActive(), validateActive()
```

### Messaging
```
Conversation: applicationId(unique), businessUserId, individualUserId,
              status(OPEN|OFFER_PENDING|AGREED|CLOSED)
Methods: markOfferPending(), reopen(), agree(), close(), isWritable(), isParticipant()

Message: conversation(ManyToOne), senderId, messageType(TEXT|OFFER), content(TEXT), isRead, offer(OneToOne)

Offer: message(OneToOne), rewardType, quantity, validityDays, unit, note,
       status(PENDING|ACCEPTED|REJECTED|COUNTERED)
Methods: accept(), reject(), counter(), isPending()
```

### Swap
```
SwapListing: ownerId, offeredCouponId(unique), wantedRewardType(RewardType),
             wantedQuantity, wantedDescription(TEXT), status(OPEN|MATCHED|CANCELLED|EXPIRED), expiresAt
Methods: match(), cancel(), expire(), isOpen(), isOwnedBy()

SwapOffer: swapListing(ManyToOne), offererId, offeredCouponId, message(TEXT),
           status(PENDING|ACCEPTED|REJECTED)
Methods: accept(), reject(), isPending()

SwapTrade: swapListing(OneToOne), swapOffer(OneToOne),
           initiatorCouponId, receiverCouponId, initiatorNewOwnerId, receiverNewOwnerId, completedAt
```

### Subscription
```
SubscriptionPlan: name(unique), displayName, priceMonthly, priceYearly(BigDecimal),
                  stripePriceIdMonthly, stripePriceIdYearly, isActive, features(List<PlanFeature>)

BusinessSubscription: businessId(unique), plan(ManyToOne), status(ACTIVE|CANCELLED|PAST_DUE|TRIALING),
                      stripeCustomerId, stripeSubscriptionId, currentPeriodStart, currentPeriodEnd,
                      cancelAtPeriodEnd, pastDueSince
Methods: activate(), markPastDue(), cancel(), scheduleCancel(), isGracePeriodExpired(), isPaid()

PlanFeature: plan(ManyToOne), featureKey(FeatureKey), featureValue(String)
FeatureKey: MAX_ACTIVE_LISTINGS, MAX_UNDER_REVIEW_PER_LISTING, CAN_FEATURE_LISTING,
            CAN_SEE_APPLICANT_CONTACTS, SWAP_MARKET_ACCESS, ANALYTICS_ACCESS, PRIORITY_SUPPORT

SubscriptionInvoice: subscription(ManyToOne), stripeInvoiceId(unique), amount(BigDecimal),
                     currency("TRY"), status(InvoiceStatus), invoiceUrl, paidAt
```

### Notification
```
Notification: userId, type(NotificationType), referenceId, referenceType, title, body(TEXT), isRead
NotificationType: APPLICATION_RECEIVED/ACCEPTED/REJECTED, NEW_MESSAGE, OFFER_RECEIVED/ACCEPTED/REJECTED,
                  COUPON_ISSUED/EXPIRING_SOON/EXPIRED, SWAP_OFFER_RECEIVED/ACCEPTED/REJECTED,
                  SWAP_COMPLETED, SUBSCRIPTION_RENEWED/PAYMENT_FAILED, PLAN_UPGRADED
```

---

## Konfigürasyon

### SecurityConfig
- CSRF kapalı, stateless session
- Herkese açık: `/api/auth/**`, `/api/listings/**`, `/api/plans`, `/api/webhooks/stripe`, `/actuator/health`
- `@HasRole("BUSINESS")` → `/api/business/**`
- `@HasRole("INDIVIDUAL")` → `/api/individual/**`
- BCryptPasswordEncoder strength=12

### WebSocketConfig
- STOMP endpoint: `/ws` (SockJS fallback ile)
- Broker: `/topic`, `/queue`; app prefix: `/app`; user prefix: `/user`
- JWT interceptor: JwtHandshakeInterceptor + JwtChannelInterceptor (messaging/config/)

### RedisConfig
- `RedisTemplate<String, String>` — StringRedisSerializer tüm serileştirici slotlarında

### AsyncConfig
- Bean: `pushNotificationExecutor` (ThreadPoolTaskExecutor — core=5, max=20, queue=100)

---

## Flyway Migrasyonlar

`src/main/resources/db/migration/`:
```
V1__create_users.sql
V2__create_listings.sql
V3__create_applications.sql
V4__create_coupons.sql
V5__create_swap.sql
V6__create_subscriptions.sql
V7__create_notifications.sql
V8__create_refresh_tokens.sql
V9__create_fcm_tokens.sql
```

`src/main/resources/db/migration/messaging/`:
```
V1__create_conversations.sql
V2__create_messages.sql
```

---

## Mimari Desenler

| Desen | Kullanım Yeri |
|-------|--------------|
| **Facade** | `UserFacade`, `ListingFacade` — modüller arası sorgular |
| **Domain Events** | `DomainEventPublisher` + `@TransactionalEventListener(AFTER_COMMIT)` |
| **Feature Gate** | `FeatureGateService` — plan özelliklerini Redis'te önbellekler |
| **Mapper** | Her modülde ayrı Mapper sınıfı (entity ↔ DTO) |
| **Scheduler** | `ListingExpiryScheduler`, `ViewCountFlushScheduler`, `MessageFlushScheduler`, `SubscriptionScheduler` |

---

## Ortam Değişkenleri

| Değişken | Varsayılan | Açıklama |
|----------|-----------|----------|
| `DB_URL` | `jdbc:postgresql://localhost:5432/takkas` | PostgreSQL bağlantı URL |
| `DB_USER` | `takkas` | DB kullanıcı |
| `DB_PASS` | `takkas` | DB şifre |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `JWT_SECRET` | `change-me-in-production-min-32-chars!!` | JWT imza anahtarı (min 32 karakter) |
| `BASE_URL` | `http://localhost:8080` | Uygulama base URL |
| `STRIPE_SECRET_KEY` | `sk_test_placeholder` | Stripe gizli anahtar |
| `STRIPE_WEBHOOK_SECRET` | `whsec_placeholder` | Stripe webhook imza doğrulama |

---

## application.yml Özeti

```yaml
spring.jpa.hibernate.ddl-auto: validate   # Migration Flyway yapar, JPA doğrular
spring.jpa.show-sql: false                # dev profile'da true
app.jwt.access-token-expiry-ms: 900000   # 15 dakika
management.endpoints: health, info        # Actuator sadece health/info
```

---

## Test

- TestContainers kullanılır (PostgreSQL container ile gerçek DB testi)
- `spring-security-test` mevcut
- Test profili: `application-test.yml` (`spring.profiles.active=test`)

---

## Dikkat Edilecekler

- `ddl-auto: validate` — entity değiştirilince mutlaka yeni Flyway migration yazılmalı
- JWT secret production'da env var üzerinden verilmeli (min 32 karakter)
- `FeatureGateService` plan limitlerini Redis'te cache'ler; plan güncellenince cache invalidation yapılmalı
- WebSocket mesajları buffer'lanır (`MessageBufferService`) ve scheduler ile flush edilir — direkt persist etme
- Domain event publish işlemleri `AFTER_COMMIT` fazında olur; aynı transaction içinde bekleme yapma
- `CouponActivationListener` ve `CouponEventListener` ayrı ayrı dinleyici — ikisi de aynı eventi bekleyebilir, dikkatli ol
