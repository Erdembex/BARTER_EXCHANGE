package com.takkas.modules.swap.api.dto;
import com.takkas.modules.listing.domain.enums.RewardType;
import com.takkas.modules.swap.domain.enums.SwapListingStatus;
import java.time.Instant;
import java.util.UUID;
public record SwapListingCardResponse(
    UUID id, UUID ownerId,
    RewardType offeredRewardType, Integer offeredQuantity,
    String offeredUnit, String offeredDescription, Instant offeredCouponExpiresAt,
    RewardType wantedRewardType, Integer wantedQuantity, String wantedDescription,
    SwapListingStatus status, Instant createdAt, Instant expiresAt) {}
