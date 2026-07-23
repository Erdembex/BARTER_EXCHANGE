package com.takkas.modules.feedback.api.dto;

import java.util.List;

public record ProfileFeedbackSummary(
    double averageStars,
    long totalCount,
    List<FeedbackResponse> recent
) {}
