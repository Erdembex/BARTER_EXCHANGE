package com.takkas.common.event;

import java.util.UUID;

public record BusinessVerificationSubmittedEvent(
    UUID profileId,
    UUID businessUserId,
    String businessName
) {}
