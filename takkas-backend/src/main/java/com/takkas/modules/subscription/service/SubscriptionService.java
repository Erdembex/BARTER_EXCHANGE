package com.takkas.modules.subscription.service;

import com.takkas.common.event.*;
import com.takkas.common.exception.*;
import com.takkas.modules.subscription.domain.*;
import com.takkas.modules.subscription.domain.enums.SubscriptionStatus;
import com.takkas.modules.subscription.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class SubscriptionService {

    private final BusinessSubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final FeatureGateService featureGateService;
    private final DomainEventPublisher eventPublisher;

    public void assignFreePlan(UUID businessId) {
        if (subscriptionRepository.findByBusinessId(businessId).isPresent()) return;
        var freePlan = planRepository.findByName("FREE")
            .orElseThrow(() -> new ResourceNotFoundException("FREE plan bulunamadı."));
        subscriptionRepository.save(BusinessSubscription.builder()
            .businessId(businessId).plan(freePlan).status(SubscriptionStatus.ACTIVE).build());
    }

    public void cancelAtPeriodEnd(UUID businessId) {
        var sub = subscriptionRepository.findByBusinessId(businessId)
            .orElseThrow(() -> new ResourceNotFoundException("Abonelik bulunamadı."));
        if (!sub.isPaid()) throw new BusinessRuleException("İptal edilecek aktif abonelik yok.");
        sub.scheduleCancel();
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
