package com.takkas.modules.messaging.api.dto;
import com.takkas.modules.listing.domain.enums.RewardType;
import jakarta.validation.constraints.*;
public record SendOfferRequest(
    @NotNull RewardType rewardType,
    @NotNull @Min(1) Integer quantity,
    @NotBlank String unit,
    @NotNull @Min(1) Integer validityDays,
    @Size(max = 500) String note) {}
