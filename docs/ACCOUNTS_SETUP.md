# Hesap Açma Rehberi — Passla Yayın

Her hesap için kayıt ol, e-posta doğrula, ödeme/kimlik adımlarını tamamla.
Tamamladıkça `[ ]` → `[x]` işaretle.

## 1. Domain

- [x] Domain satın alındı: **passla.com.tr** (Natro — sadece kayıt)
- [ ] Cloudflare Free + nameserver (Natro → DNS Değiştir) → [`CLOUDFLARE_SETUP.md`](CLOUDFLARE_SETUP.md)
- [ ] SSL aktif → `https://passla.com.tr/gizlilik.html`
## 2. Oracle Cloud (Backend sunucu — ücretsiz)

1. https://cloud.oracle.com → Sign Up
2. Kredi kartı doğrulama (Always Free için ücret alınmaz)
3. Home → Create VM Instance (Faz 1'de detay: [`ORACLE_DEPLOY.md`](ORACLE_DEPLOY.md))

- [x] Hesap açıldı
- [x] VM ayakta (`150.230.158.219`)

## 3. Amazon AWS (S3 medya — ücretsiz tier)

1. https://aws.amazon.com → Create Account
2. IAM kullanıcısı + S3 bucket (detay: [`../takkas-backend/deploy/aws/S3_SETUP.md`](../takkas-backend/deploy/aws/S3_SETUP.md))

- [ ] Hesap açıldı
- [ ] Bucket: `passla-media-prod`
- [ ] Root MFA etkin (önerilir)

## 4. SendGrid (E-posta — ücretsiz ~100/gün)

1. https://sendgrid.com → Start for free
2. API Key oluştur
3. Domain doğrulama **passla.com.tr** (detay: [`../takkas-backend/deploy/mail/MAIL_SETUP.md`](../takkas-backend/deploy/mail/MAIL_SETUP.md))

- [ ] Hesap açıldı
- [ ] API key oluşturuldu
- [ ] Domain doğrulandı

## 5. Google Play Console (~25 USD)

1. https://play.google.com/console → Create developer account
2. Ödeme profili + kimlik doğrulama (1–2 gün sürebilir)

- [ ] Geliştirici hesabı aktif
- [ ] Ödeme tamamlandı

## 6. Apple Developer Program (~99 USD/yıl)

1. https://developer.apple.com/programs/enroll/
2. Apple ID ile kayıt, ödeme, onay (24–48 saat)

- [ ] Enrollment tamamlandı
- [ ] App Store Connect erişimi var

## 7. Expo / EAS (Mobil build)

1. https://expo.dev → Sign up (GitHub ile olabilir)
2. `cd bex && npx eas login`

- [x] Expo hesabı açıldı (`erdem1803`)
- [x] `eas login` başarılı

## 8. Firebase (Push + App Check)

1. https://console.firebase.google.com
2. Mevcut `bexcursor` projesini kullan veya yeni proje
3. Android + iOS: **`com.passla.app`**
4. Service Account JSON indir → `firebase-sa.json` (git'e ekleme)

- [ ] Android app kayıtlı (`com.passla.app`)
- [ ] iOS app kayıtlı (`com.passla.app`)
- [ ] Service account JSON sunucuda `/opt/takkas/firebase-sa.json`

## 9. Gizlilik sitesi

- [x] [`website/`](../website/) Passla metinleri hazır
- [x] Oracle nginx statik site yapılandırıldı
- [ ] DNS + SSL sonrası `https://passla.com.tr/gizlilik.html` tarayıcıda açılıyor
- [x] `bex/app.json` → `privacyPolicyUrl` = `https://passla.com.tr/gizlilik.html`

## 10. Store görselleri

- [ ] En az 2 telefon ekran görüntüsü
- [ ] 512×512 ikon ([`bex/assets/icon.png`](../bex/assets/icon.png))
- [ ] Listing metinleri: [`bex/store-listing/`](../bex/store-listing/)

---

**Production altyapı özeti:** [`PRODUCTION_INFRA.md`](PRODUCTION_INFRA.md)
