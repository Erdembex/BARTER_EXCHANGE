package com.takkas.modules.notification.api.dto;
import jakarta.validation.constraints.NotBlank;
public record FcmTokenRequest(@NotBlank String token, @NotBlank String platform) {}
