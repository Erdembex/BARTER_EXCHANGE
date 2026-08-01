package com.takkas.modules.messaging.api.dto;

import com.takkas.modules.listing.api.dto.CreateListingRequest;
import com.takkas.modules.listing.domain.enums.WeeklyHours;
import com.takkas.modules.user.domain.enums.Skill;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;

public record SendOfferRequest(
    @NotBlank @Size(min = 5, max = 255) String title,
    @NotBlank @Size(min = 20) String description,
    @NotNull WeeklyHours weeklyHours,
    @NotEmpty List<Skill> skills,
    @NotNull @Valid CreateListingRequest.RewardRequest reward,
    Instant expiresAt,
    @Size(max = 500) String note) {}
