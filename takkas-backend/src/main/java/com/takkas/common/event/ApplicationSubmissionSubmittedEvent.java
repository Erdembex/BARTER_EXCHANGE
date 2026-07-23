package com.takkas.common.event;

import java.util.UUID;

public record ApplicationSubmissionSubmittedEvent(
    UUID applicationId,
    UUID businessUserId,
    UUID individualProfileId
) {}
