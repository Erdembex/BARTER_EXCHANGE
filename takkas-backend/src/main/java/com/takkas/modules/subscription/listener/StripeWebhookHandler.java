package com.takkas.modules.subscription.listener;

import com.stripe.model.*;
import com.stripe.model.checkout.Session;
import com.takkas.modules.subscription.domain.*;
import com.takkas.modules.subscription.domain.enums.InvoiceStatus;
import com.takkas.modules.subscription.repository.*;
import com.takkas.modules.subscription.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class StripeWebhookHandler {

    private final StripeService stripeService;
    private final SubscriptionService subscriptionService;
    private final BusinessSubscriptionRepository subscriptionRepository;
    private final SubscriptionInvoiceRepository invoiceRepository;
    private final SubscriptionPlanRepository planRepository;
    private final FeatureGateService featureGateService;

    @Transactional
    public void handleWebhook(String payload, String sigHeader) {
        var event = stripeService.constructWebhookEvent(payload, sigHeader);
        log.info("[StripeWebhookHandler] Event: type={}", event.getType());
        switch (event.getType()) {
            case "invoice.payment_succeeded"      -> handleInvoicePaid(event);
            case "invoice.payment_failed"         -> handlePaymentFailed(event);
            case "customer.subscription.deleted"  -> handleSubDeleted(event);
            case "checkout.session.completed"     -> handleCheckoutCompleted(event);
            default -> log.debug("[StripeWebhookHandler] İşlenmeyen: {}", event.getType());
        }
    }

    private void handleInvoicePaid(Event event) {
        var invoice = (Invoice) event.getDataObjectDeserializer().getObject().orElseThrow();
        if (invoiceRepository.findByStripeInvoiceId(invoice.getId()).isPresent()) return;
        subscriptionRepository.findByStripeSubscriptionId(invoice.getSubscription())
            .ifPresent(sub -> invoiceRepository.save(SubscriptionInvoice.builder()
                .subscription(sub).stripeInvoiceId(invoice.getId())
                .amount(BigDecimal.valueOf(invoice.getAmountPaid()).movePointLeft(2))
                .currency(invoice.getCurrency().toUpperCase())
                .status(InvoiceStatus.PAID)
                .invoiceUrl(invoice.getHostedInvoiceUrl())
                .paidAt(Instant.ofEpochSecond(invoice.getStatusTransitions().getPaidAt()))
                .build()));
    }

    private void handlePaymentFailed(Event event) {
        var invoice = (Invoice) event.getDataObjectDeserializer().getObject().orElseThrow();
        subscriptionService.handlePaymentFailed(invoice.getSubscription());
    }

    private void handleSubDeleted(Event event) {
        var sub = (com.stripe.model.Subscription) event.getDataObjectDeserializer().getObject().orElseThrow();
        subscriptionService.handleSubscriptionCancelled(sub.getId());
    }

    private void handleCheckoutCompleted(Event event) {
        var session = (Session) event.getDataObjectDeserializer().getObject().orElseThrow();
        UUID businessId = UUID.fromString(session.getMetadata().get("businessId"));
        String targetPlanIdStr = session.getMetadata().get("targetPlanId");

        subscriptionRepository.findByBusinessId(businessId).ifPresent(sub -> {
            sub.setStripeCustomerId(session.getCustomer());
            sub.setStripeSubscriptionId(session.getSubscription());
            if (targetPlanIdStr != null) {
                planRepository.findById(UUID.fromString(targetPlanIdStr)).ifPresent(plan -> {
                    // Aboneliği yeni planla aktifleştir; fatura periyodu invoice event'inde güncellenir
                    sub.activate(plan, session.getSubscription(),
                        Instant.now(), Instant.now().plus(30, ChronoUnit.DAYS));
                    featureGateService.evictPlanCache(plan.getName());
                    log.info("[StripeWebhookHandler] Plan güncellendi: business={} plan={}", businessId, plan.getName());
                });
            }
        });
    }
}
