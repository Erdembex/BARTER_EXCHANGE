Dosyayı tam olarak okudum. BEX'in vizyonunu net biçimde kavradım: para transferi olmayan, beceri-hizmet takasına dayalı, güven altyapısı üzerine kurulu bir görev-ödül ekosistemi. Airbnb/Revolut kalitesinde tasarım hedefi ve yatırım alabilecek olgunlukta bir startup mimarisi hedefleniyor.

Aşağıda React Native/Expo + Firebase üzerine kurulu, aşamalı ve teknik MVP yol haritasını sunuyorum.

BEX — Teknik MVP Yol Haritası
FAZ 0 — Temel Altyapı (Gün 1–2)
1. Proje İskeleti

expo init bex --template expo-template-blank-typescript
Klasör yapısı:

src/
├── app/              # Expo Router sayfaları (file-based routing)
├── components/       # Paylaşılan UI bileşenleri
├── features/         # Feature-first modüller (auth, tasks, rewards…)
├── hooks/            # Custom hook'lar
├── lib/              # Firebase init, yardımcı fonksiyonlar
├── store/            # Zustand global state
├── theme/            # Design tokens (renkler, tipografi, spacing)
└── types/            # TypeScript tip tanımları
2. Firebase Projesi Kurulumu

Authentication (Email/Password + Phone)
Firestore Database
Firebase Storage
Cloud Functions (Node.js 20)
Firebase Cloud Messaging (FCM)
App Check (güvenlik için)
3. Design Token Sistemi

COLORS: { primary: '#F5C518', background: '#FFFFFF', text: '#0A0A0A', surface: '#F7F7F7', border: '#E5E5E5' }
TYPOGRAPHY: Inter font ailesi
RADIUS: { sm: 8, md: 12, lg: 20, xl: 28 }
Bağımlılıklar: expo-router, firebase, zustand, react-native-reanimated, react-native-gesture-handler, @shopify/restyle (design system), expo-image-picker, expo-camera, react-native-qrcode-svg, expo-notifications

FAZI 1 — Kimlik Doğrulama & Kullanıcı Rolleri (Gün 3–5)
Firestore: users koleksiyonu

interface User {
  uid: string;
  role: 'user' | 'business' | 'admin';
  displayName: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  avatarUrl: string;
  reputationScore: number;      // 0–100
  completedTaskCount: number;
  joinedAt: Timestamp;
  isBanned: boolean;
}
Ekranlar:

Onboarding — 3 slide (BEX nedir, nasıl çalışır, başla)
Register — Email + şifre + rol seçimi (Kullanıcı / İşletme)
PhoneVerification — SMS OTP ile telefon doğrulama
Login
ForgotPassword
Firebase Auth Stratejisi: Kayıt sonrası Custom Claims ile rol atanır (Cloud Function tetikleyici). Bu sayede Firestore kuralları role göre kısıtlanır.

FAZ 2 — Veri Modeli (Gün 5–6)
Tüm koleksiyonlar tasarlanır, Firestore Security Rules yazılır.

businesses koleksiyonu

interface Business {
  id: string;
  ownerUid: string;
  name: string;
  category: string;
  logoUrl: string;
  address: string;
  location: GeoPoint;         // Yakındaki fırsatlar için
  isVerified: boolean;
  reputationScore: number;
  totalTasksPublished: number;
  createdAt: Timestamp;
}
tasks koleksiyonu

interface Task {
  id: string;
  businessId: string;
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedHours: number;
  rewardDescription: string;      // "5 ücretsiz saç tıraşı"
  rewardQuantity: number;
  maxApplicants: number;
  currentApplicantCount: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  location: GeoPoint;
  deadline: Timestamp;
  createdAt: Timestamp;
  approvedByAdmin: boolean;
}
applications koleksiyonu

interface Application {
  id: string;
  taskId: string;
  userId: string;
  businessId: string;
  status: 'pending' | 'approved' | 'rejected' | 'submitted' | 'rewarded';
  submissionText: string;
  submissionFiles: string[];      // Storage URL'leri
  submittedAt: Timestamp;
  reviewedAt: Timestamp;
  reviewNote: string;
}
coupons koleksiyonu

interface Coupon {
  id: string;
  userId: string;
  businessId: string;
  taskId: string;
  applicationId: string;
  rewardDescription: string;
  totalUses: number;              // Toplam kullanım hakkı (örn. 5 tıraş)
  usedCount: number;
  qrCode: string;                 // Unique hash
  couponCode: string;             // BEX-XXXX-XXXX
  expiresAt: Timestamp;
  usageHistory: CouponUsage[];
  status: 'active' | 'exhausted' | 'expired';
}
FAZ 3 — Kullanıcı Akışı — Görev Ekranları (Gün 7–12)
Ana Sayfa (HomeScreen)

Kişiselleştirilmiş karşılama başlığı
Arama çubuğu (Firestore array-contains ile)
Yatay kaydırmalı kategori filtreleri
"Öne Çıkan Görevler" — admin tarafından featured: true işaretlenenler
"Popüler İşletmeler" — reputationScore'a göre sıralı
"Aktif Görevlerim" — kullanıcının pending/submitted başvuruları
Görev Listesi (TaskFeedScreen)

Sonsuz kaydırma (Firestore cursor-based pagination)
Kategori, zorluk, ödül tipi filtreleri
Konum bazlı filtreleme (GeoPoint + geofirestore)
Görev Detay (TaskDetailScreen)

Görev kartı tam içeriği
İşletme profili widget'ı
"Başvur" CTA butonu
Benzer görevler önerisi
Başvuru Ekranı (ApplyScreen)

Kullanıcı neden uygun? (textarea)
Portfolio/örnek çalışma linki
Başvuru gönder → applications koleksiyonuna kayıt
Görev Teslim Ekranı (SubmitTaskScreen)

Çalışma açıklaması
Dosya/fotoğraf yükleme (Firebase Storage)
Gönder → application status submitted olur
İşletmeye + admin'e FCM bildirimi gönderilir
FAZ 4 — İşletme Paneli (Gün 13–17)
Görev Oluşturma (CreateTaskScreen)

Çok adımlı form (stepper): Temel Bilgiler → Ödül Tanımı → Gereksinimler → Önizleme
Görev yayınlanınca admin onayına düşer (approvedByAdmin: false)
Cloud Function: admin'e otomatik bildirim
Başvuru Yönetimi (ApplicationsScreen)

Başvuru listesi, kullanıcı profili önizlemesi
Teslim edilen dosyaları inceleme
Onayla / Reddet → Onaylanırsa Cloud Function otomatik kupon üretir
Kupon Takip (CouponTrackingScreen)

QR okuyucu ile kuponu doğrula
Her kullanımda usedCount artar
Kupon tamamen kullanılınca exhausted olur
Analitik (BusinessAnalyticsScreen)

Yayınlanan görev sayısı
Tamamlanan görev sayısı
Dağıtılan kupon / kullanılan kupon oranı
En başarılı görev türleri
FAZ 5 — Ödül & Kupon Sistemi (Gün 18–20)
Cloud Function: onApplicationApproved

Tetikleyici: applications/{id} → status == 'rewarded'
1. Unique QR hash üret (crypto.randomUUID)
2. Benzersiz kupon kodu üret (BEX-XXXX-XXXX)
3. coupons koleksiyonuna yaz
4. Kullanıcıya FCM bildirimi gönder
5. users/{uid}.completedTaskCount += 1
Kupon Cüzdanı (WalletScreen)

Aktif kuponlar (kalan kullanım hakkı görünür)
Süresi dolmuş / tükenmiş arşiv
Her kupon kartına tıklayınca tam ekran QR modal
QR Kod Yapısı:

{ "couponId": "xxx", "businessId": "yyy", "hash": "zzz", "issuedAt": 1234567890 }
Bu JSON base64 encode edilip QR'a işlenir. İşletme okuduğunda Cloud Function ile doğrulanır.

FAZ 6 — Admin Paneli (Gün 21–24)
Admin paneli ayrı bir React (web) uygulaması olarak Firebase Hosting'e deploy edilir ya da aynı Expo uygulamasında role === 'admin' ile gizli route olarak tutulur. MVP için ikinci yaklaşım önerilir.

Görev Moderasyonu (AdminTaskReviewScreen)

Onay bekleyen görev kuyruğu
Onayla / Reddet + not
Şüpheli görev işaretle
Kullanıcı & İşletme Yönetimi

Kullanıcı arama, profil görüntüleme
Hesap askıya alma / banlama
İşletme doğrulama (verified rozet)
Fraud Dashboard

Aynı IP'den çoklu kayıt tespiti (Cloud Function log analizi)
Hızlı başvuru anomali tespiti
Şikâyet kuyruğu
FAZ 7 — Bildirimler & Mesajlaşma (Gün 25–27)
FCM Bildirimleri (Cloud Functions)

Olay	Alıcı
Görev başvurusu alındı
İşletme
Görev teslim edildi
İşletme + Admin
Görev onaylandı
Kullanıcı
Kupon oluşturuldu
Kullanıcı
Kupon kullanıldı
Kullanıcı
Görev reddedildi
Kullanıcı
Bildirimler Ekranı: Firestore notifications koleksiyonu üzerinden gerçek zamanlı onSnapshot dinleyicisi.

Mesajlar (MVP Minimal): Task başına basit bir mesajlaşma thread'i — tasks/{taskId}/messages alt koleksiyonu.

FAZ 8 — Güvenlik Katmanı (Gün 28–29)
Firestore Security Rules mimarisi:

Kullanıcılar yalnızca kendi dökümanlarını okur/yazar
İşletmeler yalnızca kendi görevlerini/başvurularını yönetir
Admin her şeye erişir
Kupon onay işlemleri yalnızca Cloud Functions üzerinden gerçekleşir (client bypass koruması)
Firebase App Check: Her istekte gerçek uygulama doğrulaması.

Rate Limiting (Cloud Functions): Kullanıcı başına saatlik başvuru limiti.

FAZ 9 — Polish, Test & Yayın Hazırlığı (Gün 30–35)
Reanimated 3 ile ekran geçiş animasyonları
Skeleton loading ekranları (içerik yüklenmeden önce)
Hata boundary'leri ve offline durumu yönetimi
Expo EAS Build ile iOS + Android .ipa / .apk üretimi
App Store / Play Store metadata hazırlığı
Teknoloji Yığını Özeti
Katman	Teknoloji	Neden
Framework
Expo SDK 51 + Expo Router
File-based routing, OTA update
Dil
TypeScript
Tip güvenliği
Veritabanı
Firestore
Gerçek zamanlı, ölçeklenebilir
Auth
Firebase Auth
Phone + Email, Custom Claims
Dosya Depolama
Firebase Storage
Submission kanıtları
Backend Mantığı
Cloud Functions (Node 20)
Kupon üretimi, fraud logic
Bildirimler
FCM + expo-notifications
Cross-platform push
State
Zustand
Basit, performanslı
UI Sistemi
@shopify/restyle
Type-safe design tokens
Animasyon
Reanimated 3
Native thread animasyon
QR
react-native-qrcode-svg
Kupon QR üretimi
Navigation
Expo Router (React Navigation)
MVP Öncelik Sırası (Kritik Yol)
FAZ 0 (Altyapı) → FAZ 1 (Auth) → FAZ 2 (Veri Modeli) → FAZ 3 (Görev Akışı)
      ↓
FAZ 5 (Kupon Sistemi) → FAZ 4 (İşletme Paneli) → FAZ 6 (Admin) → FAZ 7-8-9
İlk çalışan demo için FAZ 0–3 + FAZ 5 yeterlidir: kullanıcı kayıt olur, görev görür, başvurur, teslim eder ve kupon kazanır.

Yol haritası onaylandığında hangi fazdan başlamak istediğini söyle, ilk kodlamaya geçelim.

