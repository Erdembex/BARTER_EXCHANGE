package com.takkas.common.event;

import java.util.UUID;

public record PrivateListingAcceptedEvent(
    UUID conversationId,
    UUID businessUserId,
    UUID applicationId,
    UUID listingId) {}
