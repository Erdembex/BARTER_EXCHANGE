package com.takkas.modules.subscription.service;

import com.takkas.common.event.*;
import com.takkas.modules.subscription.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionScheduler {

    private final BusinessSubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final DomainEventPublisher eventPublisher;

    @Scheduled(cron = "0 0 6 * * *", zone = "Europe/Istanbul")
    @Transactional
    public void handleExpiredGracePeriods() {
        var threshold = Instant.now().minus(3, ChronoUnit.DAYS);
        var expired = subscriptionRepository.findExpiredGracePeriod(threshold);
        expired.forEach(sub -> {
            try { eventPublisher.publish(new SubscriptionGracePeriodExpiredEvent(sub.getBusinessId())); }
            catch (Exception e) { log.error("[SubscriptionScheduler] businessId={}", sub.getBusinessId()); }
        });
        log.info("[SubscriptionScheduler] {} işletmenin grace period'u doldu.", expired.size());
    }

    @Scheduled(cron = "0 0 7 * * *", zone = "Europe/Istanbul")
    @Transactional
    public void processDueCancellations() {
        var due = subscriptionRepository.findDueCancellations(Instant.now());
        var freePlan = planRepository.findByName("FREE").orElseThrow();
        due.forEach(sub -> {
            try {
                String oldPlan = sub.getPlan().getName();
                sub.cancel(); sub.setPlan(freePlan);
                eventPublisher.publish(new SubscriptionChangedEvent(sub.getBusinessId(), oldPlan, "FREE"));
            } catch (Exception e) { log.error("[SubscriptionScheduler] cancel err businessId={}", sub.getBusinessId()); }
        });
        log.info("[SubscriptionScheduler] {} abonelik iptal edildi.", due.size());
    }
}
