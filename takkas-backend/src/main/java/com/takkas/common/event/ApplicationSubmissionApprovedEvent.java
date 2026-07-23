package com.takkas.common.event;

import java.util.UUID;

public record ApplicationSubmissionApprovedEvent(
    UUID applicationId,
    UUID businessUserId,
    UUID individualUserId
) {}
