package com.takkas.modules.auth.api.dto;
import jakarta.validation.constraints.NotBlank;
public record FcmTokenRegisterRequest(@NotBlank String token, @NotBlank String platform) {}
