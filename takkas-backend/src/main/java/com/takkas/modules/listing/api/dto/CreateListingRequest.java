package com.takkas.modules.listing.api.dto;

import com.takkas.modules.listing.domain.enums.RewardType;
import com.takkas.modules.listing.domain.enums.WeeklyHours;
import com.takkas.modules.user.domain.enums.Skill;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;

public record CreateListingRequest(
    @NotBlank @Size(min = 5, max = 255) String title,
    @NotBlank @Size(min = 20) String description,
    @NotNull WeeklyHours weeklyHours,
    @NotEmpty List<Skill> skills,
    @NotNull @Valid RewardRequest reward,
    Instant expiresAt
) {
    public record RewardRequest(
        @NotNull RewardType rewardType,
        @NotNull @Min(1) Integer quantity,
        @NotBlank String unit,
        @NotNull @Min(1) Integer validityDays,
        String description
    ) {}
}
