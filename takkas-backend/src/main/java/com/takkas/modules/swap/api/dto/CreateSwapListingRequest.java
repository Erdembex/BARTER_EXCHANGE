package com.takkas.modules.swap.api.dto;
import com.takkas.modules.listing.domain.enums.RewardType;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.UUID;
public record CreateSwapListingRequest(
    @NotNull UUID offeredCouponId,
    @NotNull RewardType wantedRewardType,
    @NotNull @Min(1) Integer wantedQuantity,
    @Size(max = 500) String wantedDescription,
    Instant expiresAt) {}
