package com.takkas.common.event;
import com.takkas.modules.listing.domain.enums.RewardType;
import java.time.Instant;
import java.util.UUID;
public record CouponIssuedEvent(
    UUID couponId, UUID ownerId, UUID individualUserId,
    UUID businessId, RewardType rewardType,
    Integer quantity, String unit, Instant expiresAt) {}
