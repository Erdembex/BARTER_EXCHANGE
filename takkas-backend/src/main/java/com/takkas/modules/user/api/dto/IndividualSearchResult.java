package com.takkas.modules.user.api.dto;

import java.util.UUID;

public record IndividualSearchResult(
    UUID profileId,
    String username,
    String fullName,
    String avatarUrl,
    int completedTaskCount) {}
