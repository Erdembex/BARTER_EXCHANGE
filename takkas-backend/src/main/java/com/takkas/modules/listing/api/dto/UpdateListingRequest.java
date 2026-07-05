package com.takkas.modules.listing.api.dto;

import com.takkas.modules.listing.domain.enums.RewardType;
import com.takkas.modules.listing.domain.enums.WeeklyHours;
import com.takkas.modules.user.domain.enums.Skill;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;

public record UpdateListingRequest(
    @NotBlank @Size(min = 5, max = 255) String title,
    @NotBlank String description,
    WeeklyHours weeklyHours,
    List<Skill> skills,
    RewardType rewardType,
    Integer quantity, String unit, Integer validityDays, String rewardDescription,
    Instant expiresAt
) {}
