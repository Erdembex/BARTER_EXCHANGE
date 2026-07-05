package com.takkas.modules.application.api.dto;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.user.domain.enums.Skill;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
public record ApplicantResponse(
    UUID applicationId, UUID individualId, String fullName,
    String avatarUrl, List<Skill> skills, String coverLetterExcerpt,
    ApplicationStatus status, Instant appliedAt) {}
