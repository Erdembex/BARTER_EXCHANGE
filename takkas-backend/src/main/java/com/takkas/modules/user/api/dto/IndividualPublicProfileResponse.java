package com.takkas.modules.user.api.dto;

import java.util.List;
import java.util.UUID;

public record IndividualPublicProfileResponse(
    UUID profileId,
    String fullName,
    String avatarUrl,
    int completedTaskCount,
    List<PortfolioItemResponse> portfolioItems) {}
