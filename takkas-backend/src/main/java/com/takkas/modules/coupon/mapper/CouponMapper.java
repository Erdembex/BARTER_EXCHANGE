package com.takkas.modules.coupon.mapper;

import com.takkas.modules.coupon.api.dto.*;
import com.takkas.modules.coupon.domain.Coupon;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

public class CouponMapper {

    public static CouponResponse toResponse(Coupon c) {
        return toResponse(c, null);
    }

    public static CouponResponse toResponse(Coupon c, String recipientName) {
        boolean expiringSoon = c.getExpiresAt() != null
            && Instant.now().isBefore(c.getExpiresAt())
            && c.getExpiresAt().isBefore(Instant.now().plus(3, ChronoUnit.DAYS));
        return new CouponResponse(
            c.getId(), c.getBusinessId(), null, null,
            c.getRewardType(), c.getQuantity(), c.getUnit(), c.getDescription(),
            c.getStatus(), c.getIssuedAt(), c.getExpiresAt(), c.getUsedAt(), expiringSoon,
            recipientName);
    }
}
