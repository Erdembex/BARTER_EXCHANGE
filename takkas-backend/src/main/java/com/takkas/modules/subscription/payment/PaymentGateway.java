package com.takkas.modules.subscription.payment;

import com.takkas.modules.subscription.domain.BusinessSubscription;
import com.takkas.modules.subscription.domain.SubscriptionPlan;
import com.takkas.modules.subscription.domain.enums.BillingPeriod;

/**
 * Ödeme sağlayıcısı soyutlaması.
 *
 * Şu an tek implementasyon {@link ManualPaymentGateway}: gerçek bir sanal POS/ödeme altyapısı
 * henüz bağlı değil, bu yüzden yükseltme talepleri admin tarafından manuel onaylanıyor.
 *
 * İleride bir sanal POS (örn. iyzico, PayTR, bankanın kendi POS'u vb.) entegre edilecekse:
 *   1. Bu arayüzü implemente eden yeni bir @Service sınıfı yazılır (örn. SanalPosPaymentGateway).
 *   2. Yeni sınıf @Primary yapılır (veya @ConditionalOnProperty ile app.payment.provider=sanalpos
 *      seçilir) ve ManualPaymentGateway'deki @Primary kaldırılır.
 *   3. SubscriptionService, SubscriptionController, DTO'lar ve frontend'de HİÇBİR değişiklik
 *      gerekmez — hepsi bu arayüz üzerinden çalışıyor.
 */
public interface PaymentGateway {

    /** Log/response amaçlı sağlayıcı adı (örn. "MANUAL", "STRIPE", "SANALPOS"). */
    String getProviderName();

    /**
     * Bir plan yükseltme/satın alma akışını başlatır.
     * Gerçek bir ödeme sağlayıcısı burada dış bir checkout URL'i döndürür (requiresRedirect=true).
     * Manuel akışta ise talep kayda alınır ve kullanıcıya bilgi mesajı döndürülür.
     */
    CheckoutResult startCheckout(BusinessSubscription subscription, SubscriptionPlan targetPlan, BillingPeriod period);

    /** Dönem sonunda iptal talebini sağlayıcıya iletir (gerçek sağlayıcıda: sağlayıcı tarafında da iptal planlanır). */
    void cancelSubscription(BusinessSubscription subscription);
}
