package com.takkas.common.event;
import com.takkas.modules.listing.domain.enums.RewardType;
import java.util.UUID;
public record OfferAcceptedEvent(
    UUID offerId, UUID conversationId, UUID applicationId,
    UUID businessId, UUID individualUserId,
    RewardType rewardType, Integer quantity,
    String unit, Integer validityDays, String description) {}
