package com.takkas.modules.user.api.dto;

public record BusinessAnalyticsResponse(
    int publishedTasks,
    int activeTasks,
    int pendingApproval,
    int totalApplications,
    int pendingApplications,
    int submittedApplications,
    int completedTasks,
    int couponsDistributed,
    int couponsUsed,
    int couponUseRatePercent
) {}
