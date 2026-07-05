package com.takkas.common.event;
import java.util.UUID;
public record ApplicationAcceptedEvent(
    UUID applicationId, UUID listingId, UUID businessId,
    UUID individualId, UUID businessUserId, UUID individualUserId) {}
