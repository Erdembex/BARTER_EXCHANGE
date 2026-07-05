package com.takkas.modules.coupon.listener;

import com.takkas.common.event.*;
import com.takkas.modules.coupon.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class CouponActivationListener {

    private final CouponRepository couponRepository;
    private final DomainEventPublisher eventPublisher;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onOfferAccepted(OfferAcceptedEvent event) {
        var coupon = couponRepository.findByApplicationId(event.applicationId())
            .orElseThrow();
        coupon.setRewardType(event.rewardType());
        coupon.setQuantity(event.quantity());
        coupon.setUnit(event.unit());
        coupon.setValidityDays(event.validityDays());
        coupon.setDescription(event.description());
        coupon.activate();
        couponRepository.save(coupon);
        eventPublisher.publish(new CouponIssuedEvent(
            coupon.getId(), coupon.getOwnerId(), event.individualUserId(),
            coupon.getBusinessId(), coupon.getRewardType(),
            coupon.getQuantity(), coupon.getUnit(), coupon.getExpiresAt()));
        log.info("[CouponActivationListener] Kupon aktifleştirildi: {}", coupon.getId());
    }
}
