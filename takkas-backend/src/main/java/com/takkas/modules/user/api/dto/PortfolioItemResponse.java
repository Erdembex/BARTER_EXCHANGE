package com.takkas.modules.user.api.dto;

import java.time.Instant;
import java.util.UUID;

public record PortfolioItemResponse(
    UUID applicationId,
    String listingTitle,
    String imageUrl,
    Instant approvedAt) {}
