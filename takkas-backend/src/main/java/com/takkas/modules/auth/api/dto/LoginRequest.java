package com.takkas.modules.auth.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

public record LoginRequest(
    @Schema(example = "admin@bex.dev")
    @Email @NotBlank String email,
    @Schema(example = "E123456789y.")
    @NotBlank String password) {}
