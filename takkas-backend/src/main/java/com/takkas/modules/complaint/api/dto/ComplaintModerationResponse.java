package com.takkas.modules.complaint.api.dto;

import com.takkas.modules.complaint.domain.enums.ComplaintReason;
import com.takkas.modules.complaint.domain.enums.ComplaintStatus;
import com.takkas.modules.complaint.domain.enums.ComplaintTargetType;

import java.time.Instant;
import java.util.UUID;

public record ComplaintModerationResponse(
    UUID id,
    ComplaintTargetType targetType,
    UUID targetProfileId,
    String targetName,
    ComplaintReason reason,
    String description,
    ComplaintStatus status,
    String adminNote,
    Instant createdAt,
    Instant reviewedAt) {}
