package com.takkas.modules.coupon.api.dto;
import com.takkas.modules.coupon.domain.enums.CouponStatus;
import com.takkas.modules.listing.domain.enums.RewardType;
import java.time.Instant;
import java.util.UUID;
public record CouponResponse(
    UUID id, UUID businessId, String businessName, String businessLogoUrl,
    RewardType rewardType, Integer quantity, String unit, String description,
    CouponStatus status, Instant issuedAt, Instant expiresAt, Instant usedAt,
    boolean isExpiringSoon) {}
