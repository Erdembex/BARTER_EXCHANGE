package com.takkas.modules.messaging.api.dto;
import com.takkas.modules.listing.domain.enums.RewardType;
import com.takkas.modules.messaging.domain.enums.OfferStatus;
import java.time.Instant;
import java.util.UUID;
public record OfferResponse(UUID id, UUID messageId, RewardType rewardType,
    Integer quantity, String unit, Integer validityDays, String note,
    OfferStatus status, Instant respondedAt) {}
