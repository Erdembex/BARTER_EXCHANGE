package com.takkas.modules.coupon.listener;

import com.takkas.common.event.ApplicationAcceptedEvent;
import com.takkas.modules.coupon.domain.Coupon;
import com.takkas.modules.coupon.repository.CouponRepository;
import com.takkas.modules.listing.ListingFacade;
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
public class CouponEventListener {

    private final CouponRepository couponRepository;
    private final ListingFacade listingFacade;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onApplicationAccepted(ApplicationAcceptedEvent event) {
        if (couponRepository.existsByApplicationId(event.applicationId())) {
            log.warn("[CouponEventListener] Kupon zaten mevcut: {}", event.applicationId());
            return;
        }
        var reward = listingFacade.getRewardByListingId(event.listingId());
        couponRepository.save(Coupon.builder()
            .applicationId(event.applicationId())
            .ownerId(event.individualId())
            .businessId(event.businessId())
            .rewardType(reward.rewardType())
            .quantity(reward.quantity())
            .unit(reward.unit())
            .validityDays(reward.validityDays())
            .description(reward.description())
            .build());
        log.info("[CouponEventListener] Taslak kupon oluşturuldu: {}", event.applicationId());
    }
}
