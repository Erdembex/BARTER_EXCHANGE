package com.takkas.modules.notification.listener;

import com.takkas.common.event.*;
import com.takkas.modules.notification.service.*;
import com.takkas.modules.user.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final NotificationFactory factory;
    private final UserFacade userFacade;

    // ── Başvuru ──────────────────────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(ApplicationReceivedEvent e) {
        try {
            String name = userFacade.getIndividualSummary(e.individualId()).fullName();
            notificationService.create(
                factory.applicationReceived(e.businessUserId(), e.applicationId(), name));
        } catch (Exception ex) { log.error("[NTF] APPLICATION_RECEIVED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(ApplicationAcceptedEvent e) {
        try {
            String name = userFacade.getBusinessSummary(e.businessId()).businessName();
            notificationService.create(
                factory.applicationAccepted(e.individualUserId(), e.applicationId(), name));
        } catch (Exception ex) { log.error("[NTF] APPLICATION_ACCEPTED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(ApplicationRejectedEvent e) {
        try {
            notificationService.create(
                factory.applicationRejected(e.individualUserId(), e.applicationId(), "İşletme"));
        } catch (Exception ex) { log.error("[NTF] APPLICATION_REJECTED: {}", ex.getMessage()); }
    }

    // ── Teklif / Mesaj ────────────────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(OfferAcceptedEvent e) {
        try {
            notificationService.create(
                factory.offerAccepted(e.individualUserId(), e.conversationId(), "Karşı Taraf"));
        } catch (Exception ex) { log.error("[NTF] OFFER_ACCEPTED: {}", ex.getMessage()); }
    }

    // ── Kupon ─────────────────────────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(CouponIssuedEvent e) {
        try {
            String businessName = userFacade.getBusinessSummary(e.businessId()).businessName();
            String rewardDesc   = e.quantity() + " " + e.unit();
            var userId = userFacade.getUserIdByIndividualProfileId(e.ownerId());
            notificationService.create(
                factory.couponIssued(userId, e.couponId(), businessName, rewardDesc));
        } catch (Exception ex) { log.error("[NTF] COUPON_ISSUED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(CouponExpiringSoonEvent e) {
        try {
            long daysLeft = ChronoUnit.DAYS.between(
                java.time.Instant.now(), e.expiresAt());
            var userId = userFacade.getUserIdByIndividualProfileId(e.ownerId());
            notificationService.create(
                factory.couponExpiringSoon(userId, e.couponId(), "Kuponun", daysLeft));
        } catch (Exception ex) { log.error("[NTF] COUPON_EXPIRING_SOON: {}", ex.getMessage()); }
    }

    // ── Swap ──────────────────────────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(SwapOfferReceivedEvent e) {
        try {
            String offererName = userFacade.getIndividualSummary(e.offererProfileId()).fullName();
            var ownerUserId    = userFacade.getUserIdByIndividualProfileId(e.listingOwnerProfileId());
            notificationService.create(
                factory.swapOfferReceived(ownerUserId, e.swapListingId(), offererName, "bir kupon"));
        } catch (Exception ex) { log.error("[NTF] SWAP_OFFER_RECEIVED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(SwapOfferRejectedEvent e) {
        try {
            var offererUserId = userFacade.getUserIdByIndividualProfileId(e.offererProfileId());
            notificationService.create(
                factory.swapOfferRejected(offererUserId, e.swapListingId(), "İlan Sahibi"));
        } catch (Exception ex) { log.error("[NTF] SWAP_OFFER_REJECTED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(SwapCompletedEvent e) {
        try {
            String initiatorName = userFacade.getIndividualSummary(e.initiatorProfileId()).fullName();
            String offererName   = userFacade.getIndividualSummary(e.offererProfileId()).fullName();
            var initiatorUserId  = userFacade.getUserIdByIndividualProfileId(e.initiatorProfileId());
            var offererUserId    = userFacade.getUserIdByIndividualProfileId(e.offererProfileId());
            notificationService.create(
                factory.swapCompleted(initiatorUserId, e.swapTradeId(), offererName, "Yeni"));
            notificationService.create(
                factory.swapCompleted(offererUserId, e.swapTradeId(), initiatorName, "Yeni"));
        } catch (Exception ex) { log.error("[NTF] SWAP_COMPLETED: {}", ex.getMessage()); }
    }

    // ── Abonelik ──────────────────────────────────────────

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(SubscriptionPaymentFailedEvent e) {
        try {
            var businessUserId = userFacade.getUserIdByBusinessProfileId(e.businessId());
            notificationService.create(
                factory.subscriptionPaymentFailed(businessUserId, e.businessId()));
        } catch (Exception ex) { log.error("[NTF] SUBSCRIPTION_PAYMENT_FAILED: {}", ex.getMessage()); }
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(SubscriptionChangedEvent e) {
        try {
            var businessUserId = userFacade.getUserIdByBusinessProfileId(e.businessId());
            boolean isUpgrade  = !e.newPlanName().equals("FREE")
                && !e.newPlanName().equals(e.oldPlanName());
            var notification = isUpgrade
                ? factory.planUpgraded(businessUserId, e.businessId(), e.newPlanName())
                : factory.subscriptionRenewed(businessUserId, e.businessId(), e.newPlanName());
            notificationService.create(notification);
        } catch (Exception ex) { log.error("[NTF] SUBSCRIPTION_CHANGED: {}", ex.getMessage()); }
    }
}
