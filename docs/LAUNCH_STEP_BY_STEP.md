# Passla — Adım Adım Yayın Rehberi

**Domain:** passla.com.tr · **Paket:** com.passla.app · **API:** api.passla.com.tr

Her adım bitince `[ ]` → `[x]` işaretle.

---

## ADIM 1 — Hesapları aç (bugün, ~1–2 saat)

Domain **gerekmez**. Paralel açılabilir; ödeme onayları 1–2 gün sürebilir — erken başla.

### Öncelik sırası

| Sıra | Hesap | Link | Ücret | Not |
|------|-------|------|-------|-----|
| 1 | **Oracle Cloud** | https://cloud.oracle.com | Ücretsiz | Backend sunucu — Adım 2 için şart |
| 2 | **Amazon AWS** | https://aws.amazon.com | Ücretsiz tier | Fotoğraf depolama (S3) |
| 3 | **Firebase** | https://console.firebase.google.com | Ücretsiz | Push bildirim — mevcut proje: `bexcursor` |
| 4 | **Expo (EAS)** | https://expo.dev | Ücretsiz kotası | Mobil build |
| 5 | **SendGrid** | https://sendgrid.com | Ücretsiz ~100/gün | Mail — domain sonra doğrulanır |
| 6 | **Google Play Console** | https://play.google.com/console | ~25 USD | Onay 1–2 gün |
| 7 | **Apple Developer** | https://developer.apple.com/programs/ | ~99 USD/yıl | Onay 24–48 saat |

### Her hesap için yapılacaklar

#### 1. Oracle Cloud
- [ ] Kayıt ol, e-posta doğrula
- [ ] Kredi kartı ekle (Always Free — normal kullanımda ücret yok)
- [ ] Console’a gir, **Home** açılıyor mu kontrol et
- [ ] **Tenancy / Region** not al (ör. `eu-frankfurt-1` veya en yakın bölge)

#### 2. Amazon AWS
- [ ] Hesap oluştur, e-posta + telefon doğrula
- [ ] Root hesaba **MFA** ekle (Security credentials)
- [ ] Console’a gir: https://console.aws.amazon.com

#### 3. Firebase
- [ ] https://console.firebase.google.com → proje **bexcursor** (veya yeni proje)
- [ ] Project settings → Android app: package **`com.passla.app`**
- [ ] iOS app: bundle **`com.passla.app`**
- [ ] Service Account JSON indir → `bex/firebase-sa.json` (**git’e ekleme**)
- [ ] Web config değerlerini bir yere not al (EAS secrets için — Adım 5’te)

#### 4. Expo / EAS
- [ ] https://expo.dev → Sign up (GitHub ile olabilir)
- [ ] Terminal:
  ```powershell
  cd bex
  npm install -g eas-cli
  npx eas login
  ```
- [ ] `npx eas whoami` → e-postan görünmeli

#### 5. SendGrid
- [ ] Ücretsiz plan kayıt
- [ ] Settings → API Keys → Create (Mail Send yetkisi)
- [ ] API key’i güvenli yere kaydet (**Adım 2’de** backend `.env`’e gider)
- [ ] Domain doğrulama → **domain alınca** (ertelendi)

#### 6. Google Play Console
- [ ] Geliştirici hesabı oluştur (~25 USD)
- [ ] Kimlik / ödeme doğrulamasını tamamla
- [ ] **Uygulama oluşturma** → isim/logo netleşince (ertelendi)

#### 7. Apple Developer
- [ ] Program’a kayıt (~99 USD/yıl)
- [ ] Onay e-postasını bekle
- [ ] App Store Connect erişimi: https://appstoreconnect.apple.com

---

### Adım 1 tamamlandı sayılır when:

- [ ] Oracle + AWS + Firebase + Expo hesapları **aktif**
- [ ] Play + Apple kayıt **başlatıldı** (onay bekleniyor olabilir)
- [ ] SendGrid API key **oluşturuldu**
- [ ] Firebase service account JSON **indirildi** (lokal, git dışı)

---

## ADIM 2 — Oracle VM + backend (domain sonra)

→ [`ORACLE_DEPLOY.md`](ORACLE_DEPLOY.md)

Domain olmadan: VM kurulabilir; SSL ve public API **domain alınınca** tamamlanır. Geçici test: sunucu IP + HTTP.

---

## ADIM 3 — AWS S3 + backend env

→ [`takkas-backend/deploy/aws/S3_SETUP.md`](../takkas-backend/deploy/aws/S3_SETUP.md)

---

## ADIM 4 — EAS preview build test

→ [`bex/EAS_DEPLOYMENT.md`](../bex/EAS_DEPLOYMENT.md)

---

## ADIM 5 — Mağaza (domain + isim + logo netleşince)

→ [`STORE_LAUNCH_CHECKLIST.md`](STORE_LAUNCH_CHECKLIST.md) Faz 3–5

---

## Ertelenen checklist (mağaza öncesi)

- [ ] Domain (ör. barterex.com.tr)
- [ ] Uygulama adı (ör. Barter) + logo (BEX 01) → `app.json` + `icon.png`
- [ ] Gizlilik sitesi deploy
- [ ] Store ekran görüntüleri

---

**Şimdi:** Adım 1 tablosundan **Oracle** ile başla, sırayla işaretle.
