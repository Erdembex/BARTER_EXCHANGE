package com.takkas.modules.subscription.payment;

import com.takkas.modules.subscription.domain.BusinessSubscription;
import com.takkas.modules.subscription.domain.SubscriptionPlan;
import com.takkas.modules.subscription.domain.enums.BillingPeriod;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

/**
 * İyzico sanal POS entegrasyonu iskeleti.
 *
 * Aktifleştirmek için:
 *   APP_PAYMENT_PROVIDER=iyzico
 *   IYZICO_API_KEY=...
 *   IYZICO_SECRET_KEY=...
 *   IYZICO_BASE_URL=https://api.iyzipay.com  (production)
 *
 * İyzico Java SDK dependency eklenip checkout form / 3DS akışı burada tamamlanacak.
 * Şimdilik sandbox anahtarları olmadan güvenli fallback mesajı döner.
 */
@Service
@Primary
@ConditionalOnProperty(name = "app.payment.provider", havingValue = "iyzico")
@Slf4j
public class IyzicoPaymentGateway implements PaymentGateway {

    @Value("${iyzico.api-key:}")
    private String apiKey;

    @Value("${iyzico.secret-key:}")
    private String secretKey;

    @Value("${iyzico.base-url:https://sandbox-api.iyzipay.com}")
    private String baseUrl;

    @Value("${app.base-url:http://localhost:8080}")
    private String appBaseUrl;

    @Override
    public String getProviderName() {
        return "IYZICO";
    }

    @Override
    public CheckoutResult startCheckout(
        BusinessSubscription subscription,
        SubscriptionPlan targetPlan,
        BillingPeriod period
    ) {
        if (apiKey == null || apiKey.isBlank() || secretKey == null || secretKey.isBlank()) {
            log.warn("[IyzicoPaymentGateway] API anahtarları tanımlı değil — manuel fallback");
            return new CheckoutResult(
                false,
                null,
                "Ödeme altyapısı yapılandırılıyor. Lütfen daha sonra tekrar dene veya destek ile iletişime geç.",
                null
            );
        }

        // TODO: İyzico CheckoutFormInitializeRequest ile ödeme sayfası oluştur
        // callbackUrl: appBaseUrl + "/api/webhooks/iyzico"
        String reference = "IYZ-" + subscription.getBusinessId().toString().substring(0, 8).toUpperCase();
        subscription.requestUpgrade(targetPlan, period, reference);

        log.info("[IyzicoPaymentGateway] Checkout başlatıldı (sandbox): business={} plan={} ref={}",
            subscription.getBusinessId(), targetPlan.getName(), reference);

        // Placeholder redirect — gerçek entegrasyonda iyzico checkoutFormContent URL'i döner
        String redirectUrl = baseUrl + "/payment/placeholder?ref=" + reference;

        return new CheckoutResult(
            true,
            redirectUrl,
            targetPlan.getDisplayName() + " planı için ödeme sayfasına yönlendiriliyorsun.",
            reference
        );
    }

    @Override
    public void cancelSubscription(BusinessSubscription subscription) {
        // TODO: İyzico abonelik iptali (varsa) veya yerel scheduleCancel
        subscription.scheduleCancel();
        log.info("[IyzicoPaymentGateway] İptal planlandı: business={}", subscription.getBusinessId());
    }
}
