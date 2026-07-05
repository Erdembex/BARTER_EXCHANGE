package com.takkas.modules.application.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record SubmitSubmissionRequest(
    @NotBlank @Size(min = 10, max = 5000) String description,
    @Size(min = 1, max = 5) List<@NotBlank String> imageUrls
) {}
