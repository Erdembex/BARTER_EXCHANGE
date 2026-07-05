package com.takkas.modules.notification.api.dto;

import com.takkas.modules.notification.domain.enums.NotificationType;
import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
    UUID id, NotificationType type,
    UUID referenceId, String referenceType,
    String title, String body,
    boolean isRead, Instant createdAt) {}
