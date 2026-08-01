package com.takkas.common.event;

import java.util.UUID;

public record OfferRejectedEvent(
    UUID conversationId,
    UUID businessUserId,
    UUID rejectorUserId) {}
