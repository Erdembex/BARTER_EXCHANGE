package com.takkas.common.event;

import java.util.UUID;

public record OfferSentEvent(
    UUID conversationId,
    UUID recipientUserId,
    UUID senderUserId) {}
