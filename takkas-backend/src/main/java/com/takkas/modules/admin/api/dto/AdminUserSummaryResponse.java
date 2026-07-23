package com.takkas.modules.admin.api.dto;

import java.util.UUID;

public record AdminUserSummaryResponse(
    UUID userId,
    String email,
    String displayName,
    String userType,
    String status,
    long completedTaskCount,
    int reputationScore
) {}
