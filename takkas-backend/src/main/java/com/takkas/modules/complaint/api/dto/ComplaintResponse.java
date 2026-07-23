package com.takkas.modules.complaint.api.dto;

import com.takkas.modules.complaint.domain.enums.ComplaintReason;
import com.takkas.modules.complaint.domain.enums.ComplaintStatus;

import java.time.Instant;
import java.util.UUID;

public record ComplaintResponse(
    UUID id,
    UUID businessProfileId,
    String businessName,
    ComplaintReason reason,
    String description,
    ComplaintStatus status,
    String adminNote,
    Instant createdAt,
    Instant reviewedAt
) {}
