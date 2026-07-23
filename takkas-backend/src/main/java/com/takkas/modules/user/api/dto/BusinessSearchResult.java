package com.takkas.modules.user.api.dto;

import java.util.UUID;

public record BusinessSearchResult(
    UUID profileId,
    String businessName,
    String category,
    String city,
    String district,
    boolean verified) {}
