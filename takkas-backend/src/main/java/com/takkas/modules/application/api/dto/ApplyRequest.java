package com.takkas.modules.application.api.dto;
import jakarta.validation.constraints.*;
import java.util.UUID;
public record ApplyRequest(
    @NotNull UUID listingId,
    @NotBlank @Size(min = 50, max = 1000) String coverLetter) {}
