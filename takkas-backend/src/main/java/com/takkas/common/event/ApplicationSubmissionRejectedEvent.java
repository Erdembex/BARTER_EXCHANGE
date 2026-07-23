package com.takkas.common.event;

import java.util.UUID;

public record ApplicationSubmissionRejectedEvent(
    UUID applicationId,
    UUID individualUserId,
    String reviewNote
) {}
