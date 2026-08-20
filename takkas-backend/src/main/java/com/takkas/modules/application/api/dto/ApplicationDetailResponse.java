package com.takkas.modules.application.api.dto;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.user.domain.enums.Skill;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
public record ApplicationDetailResponse(
    UUID applicationId, UUID individualId, String fullName,
    String avatarUrl, String city, String district,
    List<Skill> skills, String bio, String coverLetter,
    ApplicationStatus status, Instant appliedAt,
    String submissionText, List<String> submissionImageUrls,
    Instant submittedAt, String reviewNote, Instant reviewedAt,
    UUID listingId, UUID businessId, boolean feedbackSubmittedByMe) {}
