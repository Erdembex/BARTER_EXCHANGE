# Yayın Sonrası — BEX

## İlk 24 saat

- [ ] `curl https://api.SENIN-DOMAIN/actuator/health` düzenli kontrol
- [ ] `journalctl -u takkas -f` — hata logu yok mu
- [ ] Play internal / TestFlight'tan kayıt, görev, mesaj, push test
- [ ] `ADMIN_SEED_ENABLED=false` doğrula

## Yedekleme

Sunucuda (bir kez):

```bash
sudo bash /path/to/repo/takkas-backend/deploy/scripts/install-backup-cron.sh
```

Yedekler: `/backup/takkas-YYYY-MM-DD.sql.gz` (14 günden eski otomatik silinir)

## Güncelleme yayınlama

1. Kod değişikliği → GitHub push
2. Backend: `deploy/scripts/deploy-jar.sh ubuntu@IP key.pem`
3. Mobil: `bex/app.json` → `version` artır
4. `npm run build:production` → `npm run submit:android` / `submit:ios`

## İzleme

| Ne | Nerede |
|----|--------|
| Backend log | `journalctl -u takkas -f` |
| Nginx | `/var/log/nginx/error.log` |
| Play Console | Crash reports, ANR |
| App Store Connect | Crashes, Metrics |
| EAS | expo.dev → Builds |

## Kullanıcı geri bildirimi

- Play Console → Ratings and reviews
- App Store Connect → Ratings and Reviews
- destek@SENIN-DOMAIN e-posta

## Güvenlik periyodik

- [ ] JWT_SECRET ve DB şifreleri rotate (planlı bakım)
- [ ] Oracle Security List — SSH sadece kendi IP
- [ ] AWS IAM key rotate
- [ ] Firebase service account yetkileri minimum

## Red (rejection) gelirse

1. Apple/Google mesajını oku
2. Metadata mı, build mi, privacy mi — kategorize et
3. Düzelt → yeni build veya sadece listing güncelle
4. Tekrar submit

## Sanal POS (ileride)

Hazır olunca: [`takkas-backend/deploy/payment/IYZICO_SETUP.md`](../takkas-backend/deploy/payment/IYZICO_SETUP.md)
`APP_PAYMENT_PROVIDER=iyzico` → backend restart
