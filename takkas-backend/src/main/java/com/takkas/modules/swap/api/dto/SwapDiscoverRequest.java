package com.takkas.modules.swap.api.dto;
import com.takkas.modules.listing.domain.enums.RewardType;
import jakarta.validation.constraints.*;
import java.time.Instant;
public record SwapDiscoverRequest(
    RewardType wantedRewardType, Instant cursor,
    @Min(1) @Max(20) int pageSize) {}
