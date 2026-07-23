package com.takkas.modules.user.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubmitBusinessVerificationRequest(
    @NotBlank @Size(max = 2048) String documentUrl,
    @Size(max = 255) String documentName
) {}
