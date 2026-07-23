package com.takkas.common.event;

import java.util.UUID;

public record BusinessVerificationRejectedEvent(
    UUID profileId,
    UUID businessUserId,
    String businessName
) {}
