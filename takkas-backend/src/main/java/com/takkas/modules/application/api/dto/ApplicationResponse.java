package com.takkas.modules.application.api.dto;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import java.time.Instant;
import java.util.UUID;
public record ApplicationResponse(
    UUID applicationId, UUID listingId, String listingTitle,
    String businessName, String businessLogoUrl,
    ApplicationStatus status, Instant appliedAt) {}
