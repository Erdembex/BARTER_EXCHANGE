package com.takkas.modules.complaint.api.dto;

import com.takkas.modules.complaint.domain.enums.ComplaintReason;

import java.time.Instant;
import java.util.UUID;

public record PublicComplaintResponse(
    UUID id,
    UUID businessProfileId,
    String businessName,
    String businessCategory,
    ComplaintReason reason,
    String description,
    Instant approvedAt
) {}
