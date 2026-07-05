package com.takkas.modules.coupon;

import com.takkas.common.exception.*;
import com.takkas.modules.coupon.domain.enums.CouponStatus;
import com.takkas.modules.coupon.repository.CouponRepository;
import com.takkas.modules.listing.domain.enums.RewardType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CouponFacade {

    private final CouponRepository couponRepository;

    public CouponInfo getCouponForSwap(UUID couponId, UUID ownerId) {
        var c = couponRepository.findByIdAndOwnerIdAndStatus(couponId, ownerId, CouponStatus.ACTIVE)
            .orElseThrow(() -> new BusinessRuleException("Kupon bulunamadı, aktif değil veya size ait değil."));
        return new CouponInfo(c.getId(), c.getOwnerId(), c.getRewardType(),
            c.getQuantity(), c.getUnit(), c.getDescription(), c.getExpiresAt());
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public void markAsSwapped(UUID couponId, UUID newOwnerId) {
        var c = couponRepository.findById(couponId)
            .orElseThrow(() -> new ResourceNotFoundException("Kupon bulunamadı."));
        c.markSwapped(newOwnerId);
    }

    public boolean isCouponAvailableForSwap(UUID couponId, UUID ownerId) {
        return couponRepository.findByIdAndOwnerIdAndStatus(couponId, ownerId, CouponStatus.ACTIVE).isPresent();
    }

    public record CouponInfo(UUID id, UUID ownerId, RewardType rewardType,
                              Integer quantity, String unit, String description, Instant expiresAt) {}
}
