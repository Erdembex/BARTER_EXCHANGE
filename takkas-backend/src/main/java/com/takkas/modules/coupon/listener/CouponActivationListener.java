package com.takkas.modules.coupon.listener;

import com.takkas.common.event.*;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.coupon.domain.enums.CouponStatus;
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
    private final ApplicationRepository applicationRepository;
    private final DomainEventPublisher eventPublisher;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onOfferAccepted(OfferAcceptedEvent event) {
        var coupon = couponRepository.findByApplicationId(event.applicationId())
            .orElseThrow();

        // Kupon zaten aktifleştirilmişse (örn. issue-coupon akışıyla) tekrar işleme
        if (coupon.getStatus() == CouponStatus.ACTIVE) {
            log.warn("[CouponActivationListener] Kupon zaten aktif, atlanıyor: {}", coupon.getId());
            return;
        }

        coupon.setRewardType(event.rewardType());
        coupon.setQuantity(event.quantity());
        coupon.setUnit(event.unit());
        coupon.setValidityDays(event.validityDays());
        coupon.setDescription(event.description());
        coupon.activate();
        couponRepository.save(coupon);

        // Teklif kabul edildiğinde başvuruyu REWARDED olarak işaretle
        applicationRepository.findById(event.applicationId()).ifPresent(app -> {
            app.setStatus(ApplicationStatus.REWARDED);
            applicationRepository.save(app);
        });

        eventPublisher.publish(new CouponIssuedEvent(
            coupon.getId(), coupon.getOwnerId(), event.individualUserId(),
            coupon.getBusinessId(), coupon.getRewardType(),
            coupon.getQuantity(), coupon.getUnit(), coupon.getExpiresAt()));
        log.info("[CouponActivationListener] Kupon aktifleştirildi: {}", coupon.getId());
    }
}
