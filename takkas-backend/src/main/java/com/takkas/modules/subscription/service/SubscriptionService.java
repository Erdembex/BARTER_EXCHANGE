package com.takkas.modules.subscription.service;

import com.takkas.common.event.*;
import com.takkas.common.exception.*;
import com.takkas.modules.subscription.domain.*;
import com.takkas.modules.subscription.domain.enums.BillingPeriod;
import com.takkas.modules.subscription.domain.enums.SubscriptionStatus;
import com.takkas.modules.subscription.payment.CheckoutResult;
import com.takkas.modules.subscription.payment.PaymentGateway;
import com.takkas.modules.subscription.repository.*;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final BusinessSubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final FeatureGateService featureGateService;
    private final DomainEventPublisher eventPublisher;
    private final PaymentGateway paymentGateway;

    public void assignFreePlan(UUID businessId) {
        if (subscriptionRepository.findByBusinessId(businessId).isPresent()) return;
        var freePlan = planRepository.findByName("FREE")
            .orElseThrow(() -> new ResourceNotFoundException("FREE plan bulunamadı."));
        subscriptionRepository.save(BusinessSubscription.builder()
            .businessId(businessId).plan(freePlan).status(SubscriptionStatus.ACTIVE).build());
    }

    /** İşletme bir plana yükseltme/satın alma talep eder. Aktif PaymentGateway implementasyonuna delege eder. */
    public CheckoutResult requestUpgrade(UUID businessId, UUID targetPlanId, BillingPeriod period) {
        var sub = subscriptionRepository.findByBusinessId(businessId)
            .orElseThrow(() -> new ResourceNotFoundException("Abonelik bulunamadı."));
        var targetPlan = planRepository.findById(targetPlanId)
            .orElseThrow(() -> new ResourceNotFoundException("Hedef plan bulunamadı."));
        if (sub.getPlan().getId().equals(targetPlanId) && sub.isPaid()) {
            throw new BusinessRuleException("Bu plana zaten sahipsin.");
        }

        CheckoutResult result = paymentGateway.startCheckout(sub, targetPlan, period);

        String businessName = businessProfileRepository.findById(businessId)
            .map(com.takkas.modules.user.domain.BusinessProfile::getBusinessName)
            .orElse("Bir işletme");
        eventPublisher.publish(new SubscriptionUpgradeRequestedEvent(
            businessId, businessName, targetPlan.getDisplayName(), result.reference()));

        return result;
    }

    /** Admin: bekleyen yükseltme talebini onaylar, planı hemen aktive eder. */
    public BusinessSubscription confirmPendingUpgrade(UUID businessId) {
        var sub = subscriptionRepository.findByBusinessId(businessId)
            .orElseThrow(() -> new ResourceNotFoundException("Abonelik bulunamadı."));
        if (!sub.hasPendingUpgrade()) {
            throw new BusinessRuleException("Bu işletme için bekleyen bir yükseltme talebi yok.");
        }

        String oldPlan = sub.getPlan().getName();
        var newPlan = sub.getPendingPlan();
        var period = sub.getPendingBillingPeriod();
        Instant now = Instant.now();
        Instant end = switch (period) {
            case YEARLY -> now.plus(365, ChronoUnit.DAYS);
            case SEMIANNUAL -> now.plus(182, ChronoUnit.DAYS);
            case MONTHLY -> now.plus(30, ChronoUnit.DAYS);
        };

        sub.activate(newPlan, sub.getStripeSubscriptionId(), now, end);
        featureGateService.evictPlanCache(oldPlan);
        featureGateService.evictPlanCache(newPlan.getName());
        eventPublisher.publish(new SubscriptionChangedEvent(businessId, oldPlan, newPlan.getName()));
        return sub;
    }

    /** Admin: bekleyen talebi (örn. ödeme gelmediyse) iptal eder, plan değişmez. */
    public void rejectPendingUpgrade(UUID businessId) {
        var sub = subscriptionRepository.findByBusinessId(businessId)
            .orElseThrow(() -> new ResourceNotFoundException("Abonelik bulunamadı."));
        if (!sub.hasPendingUpgrade()) {
            throw new BusinessRuleException("Bu işletme için bekleyen bir yükseltme talebi yok.");
        }
        sub.clearPendingUpgrade();
    }

    public List<BusinessSubscription> getPendingUpgrades() {
        return subscriptionRepository.findAllWithPendingUpgrade();
    }

    public void cancelAtPeriodEnd(UUID businessId) {
        var sub = subscriptionRepository.findByBusinessId(businessId)
            .orElseThrow(() -> new ResourceNotFoundException("Abonelik bulunamadı."));
        if (!sub.isPaid()) throw new BusinessRuleException("İptal edilecek aktif abonelik yok.");
        paymentGateway.cancelSubscription(sub);
    }

    public void handleSubscriptionActivated(String stripeSubId, String planName,
                                             Instant periodStart, Instant periodEnd) {
        var sub = subscriptionRepository.findByStripeSubscriptionId(stripeSubId)
            .orElseThrow(() -> new ResourceNotFoundException("Stripe aboneliği eşleştirilemedi."));
        var plan = planRepository.findByName(planName)
            .orElseThrow(() -> new ResourceNotFoundException("Plan bulunamadı: " + planName));
        String oldPlan = sub.getPlan().getName();
        sub.activate(plan, stripeSubId, periodStart, periodEnd);
        featureGateService.evictPlanCache(oldPlan);
        featureGateService.evictPlanCache(planName);
        eventPublisher.publish(new SubscriptionChangedEvent(sub.getBusinessId(), oldPlan, planName));
    }

    public void handlePaymentFailed(String stripeSubId) {
        var sub = subscriptionRepository.findByStripeSubscriptionId(stripeSubId)
            .orElseThrow(() -> new ResourceNotFoundException("Stripe aboneliği eşleştirilemedi."));
        sub.markPastDue();
        eventPublisher.publish(new SubscriptionPaymentFailedEvent(sub.getBusinessId()));
    }

    public void handleSubscriptionCancelled(String stripeSubId) {
        var sub = subscriptionRepository.findByStripeSubscriptionId(stripeSubId)
            .orElseThrow(() -> new ResourceNotFoundException("Stripe aboneliği eşleştirilemedi."));
        String oldPlan = sub.getPlan().getName();
        sub.cancel();
        var freePlan = planRepository.findByName("FREE").orElseThrow();
        sub.setPlan(freePlan);
        featureGateService.evictPlanCache(oldPlan);
        eventPublisher.publish(new SubscriptionChangedEvent(sub.getBusinessId(), oldPlan, "FREE"));
    }
}
