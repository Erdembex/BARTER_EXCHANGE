package com.takkas.modules.swap.api.dto;
import com.takkas.modules.listing.domain.enums.RewardType;
import com.takkas.modules.swap.domain.enums.SwapListingStatus;
import java.time.Instant;
import java.util.UUID;
public record SwapListingResponse(
    UUID id, UUID ownerId, UUID offeredCouponId,
    RewardType wantedRewardType, Integer wantedQuantity, String wantedDescription,
    SwapListingStatus status, Instant createdAt, Instant expiresAt) {}
