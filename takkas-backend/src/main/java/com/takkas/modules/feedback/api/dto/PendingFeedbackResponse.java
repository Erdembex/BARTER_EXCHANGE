package com.takkas.modules.feedback.api.dto;

import com.takkas.modules.application.domain.enums.ApplicationStatus;

import java.util.UUID;

public record PendingFeedbackResponse(
    UUID applicationId,
    UUID listingId,
    String taskTitle,
    ApplicationStatus status) {}
