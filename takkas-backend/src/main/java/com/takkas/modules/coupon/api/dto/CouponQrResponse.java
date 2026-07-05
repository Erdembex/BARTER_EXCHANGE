package com.takkas.modules.coupon.api.dto;
import com.takkas.modules.listing.domain.enums.RewardType;
import java.time.Instant;
import java.util.UUID;
public record CouponQrResponse(
    UUID couponId, String qrToken, RewardType rewardType,
    Integer quantity, String unit, String description, Instant expiresAt) {}
