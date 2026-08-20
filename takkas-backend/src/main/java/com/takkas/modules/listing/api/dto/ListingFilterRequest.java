package com.takkas.modules.listing.api.dto;

import com.takkas.modules.listing.domain.enums.RewardType;
import com.takkas.modules.user.domain.enums.Skill;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;

public record ListingFilterRequest(
    String city, String district,
    List<Skill> skills,
    String q,
    RewardType rewardType,
    Instant cursor,
    @Min(1) @Max(50) Integer pageSize
) {}
