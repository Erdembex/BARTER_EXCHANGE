package com.takkas.modules.user.api.dto;

import java.time.Instant;
import java.util.UUID;

public record CompletedTaskResponse(
    UUID applicationId,
    String listingTitle,
    Instant completedAt,
    int imageCount,
    String previewImageUrl) {}
