package com.takkas.common.event;
import java.util.UUID;
public record ApplicationReceivedEvent(
    UUID applicationId, UUID listingId,
    UUID businessUserId, UUID individualId, UUID individualUserId) {}
