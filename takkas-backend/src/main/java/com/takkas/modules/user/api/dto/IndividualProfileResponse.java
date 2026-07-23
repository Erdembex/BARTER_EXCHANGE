package com.takkas.modules.user.api.dto;
import com.takkas.modules.user.domain.enums.Skill;
import java.util.List;
import java.util.UUID;
public record IndividualProfileResponse(
    UUID id, String username, String fullName, String city, String district,
    String avatarUrl, String bio, List<Skill> skills) {}
