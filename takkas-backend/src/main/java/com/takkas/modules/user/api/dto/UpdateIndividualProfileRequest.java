package com.takkas.modules.user.api.dto;

import com.takkas.modules.user.domain.enums.Skill;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateIndividualProfileRequest(
    @NotBlank String username,
    @NotBlank String fullName,
    @NotBlank String city,
    @NotBlank String district,
    String avatarUrl,
    @Size(max = 1000) String bio,
    @Size(max = 500) String cvUrl,
    @NotEmpty List<Skill> skills
) {}
