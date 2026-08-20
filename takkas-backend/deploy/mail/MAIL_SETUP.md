# Mail sağlayıcı kurulum rehberi (SendGrid örneği)

## 1. SendGrid hesabı

1. https://sendgrid.com → Free plan (~100 mail/gün)
2. Settings → API Keys → Create API Key (Restricted: Mail Send)
3. API key'i `SPRING_MAIL_PASSWORD` olarak kullan

## 2. Domain doğrulama

1. SendGrid → Settings → Sender Authentication → Authenticate Domain
2. Domain: `passla.com.tr`
3. DNS kayıtlarını domain sağlayıcısına ekle:
   - CNAME (DKIM x3)
   - TXT (SPF)
4. DMARC (opsiyonel ama önerilir):
   ```
   _dmarc.passla.com.tr TXT "v=DMARC1; p=none; rua=mailto:dmarc@passla.com.tr"
   ```

## 3. Backend env

```bash
SPRING_MAIL_HOST=smtp.sendgrid.net
SPRING_MAIL_PORT=587
SPRING_MAIL_USERNAME=apikey
SPRING_MAIL_PASSWORD=SG.xxxxx
SPRING_MAIL_FROM=noreply@passla.com.tr
```

Production profili (`application-prod.yml`) bu değerleri otomatik okur.

## 4. Gönderen adresi

Kodda gönderen: `noreply@passla.com.tr` (`SPRING_MAIL_FROM`)

Doğrulanmış domain olmadan mailler spam'e düşer.

## 5. Test

1. Backend'i prod profiliyle başlat
2. Uygulamadan "Şifremi unuttum" akışını dene
3. SendGrid Activity dashboard'dan delivery durumunu kontrol et

## Alternatif: Resend

- https://resend.com — ~3000 mail/ay ücretsiz
- SMTP: `smtp.resend.com`, port 587
- Benzer domain doğrulama süreci

## Alternatif: Amazon SES

Oracle/AWS kullanıyorsan EC2 üzerinden ayda 62.000 mail ücretsiz.
Domain doğrulama + sandbox'tan çıkış gerekir.
