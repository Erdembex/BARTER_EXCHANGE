package com.takkas.common.event;
import java.util.UUID;
public record ApplicationRejectedEvent(
    UUID applicationId, UUID listingId, UUID individualUserId) {}
