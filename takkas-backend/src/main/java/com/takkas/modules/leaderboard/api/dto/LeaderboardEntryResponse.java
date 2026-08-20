package com.takkas.modules.leaderboard.api.dto;

import java.util.UUID;

public record LeaderboardEntryResponse(
    int rank,
    UUID profileId,
    String name,
    String subtitle,
    long rewardCount,
    String avatarUrl
) {}
