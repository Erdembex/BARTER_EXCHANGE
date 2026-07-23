package com.takkas.modules.complaint.api.dto;

import com.takkas.modules.application.domain.enums.ApplicationStatus;

import java.time.Instant;
import java.util.UUID;

public record ComplaintEligibleApplicationResponse(
    UUID applicationId,
    UUID listingId,
    String listingTitle,
    UUID businessProfileId,
    String businessName,
    UUID individualProfileId,
    String individualDisplayName,
    ApplicationStatus status,
    Instant appliedAt) {}
