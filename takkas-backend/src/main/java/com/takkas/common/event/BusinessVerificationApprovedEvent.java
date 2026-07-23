package com.takkas.common.event;

import java.util.UUID;

public record BusinessVerificationApprovedEvent(
    UUID profileId,
    UUID businessUserId,
    String businessName
) {}
