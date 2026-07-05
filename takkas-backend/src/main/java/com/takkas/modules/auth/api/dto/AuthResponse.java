package com.takkas.modules.auth.api.dto;
import java.util.UUID;
public record AuthResponse(
    String accessToken, String refreshToken,
    String userType, UUID profileId) {}
