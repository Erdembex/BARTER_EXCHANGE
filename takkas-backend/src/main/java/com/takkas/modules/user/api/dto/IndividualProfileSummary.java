package com.takkas.modules.user.api.dto;
import com.takkas.modules.user.domain.enums.Skill;
import java.util.List;
import java.util.UUID;
public record IndividualProfileSummary(
    UUID id, String fullName, String avatarUrl,
    String city, String bio, List<Skill> skills) {}
