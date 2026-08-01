package com.takkas.modules.messaging.api.dto;

import com.takkas.modules.messaging.domain.enums.MessageImageReportReason;

import java.time.Instant;
import java.util.UUID;

public record MessageImageReportResponse(
    UUID id,
    UUID messageId,
    MessageImageReportReason reason,
    String description,
    Instant createdAt) {}
