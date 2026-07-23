package com.takkas.modules.feedback.api.dto;

import com.takkas.modules.feedback.domain.enums.FeedbackAuthorRole;

import java.time.Instant;
import java.util.UUID;

public record FeedbackResponse(
    UUID id,
    UUID applicationId,
    UUID targetProfileId,
    FeedbackAuthorRole authorRole,
    int stars,
    String comment,
    String authorDisplayName,
    Instant createdAt
) {}
