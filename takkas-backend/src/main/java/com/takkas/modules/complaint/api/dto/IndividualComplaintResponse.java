package com.takkas.modules.complaint.api.dto;

import com.takkas.modules.complaint.domain.enums.ComplaintReason;
import com.takkas.modules.complaint.domain.enums.ComplaintStatus;

import java.time.Instant;
import java.util.UUID;

public record IndividualComplaintResponse(
    UUID id,
    UUID individualProfileId,
    String individualDisplayName,
    ComplaintReason reason,
    String description,
    ComplaintStatus status,
    String adminNote,
    Instant createdAt,
    Instant reviewedAt) {}
