package com.takkas.modules.swap.api.dto;
import com.takkas.modules.swap.domain.enums.SwapOfferStatus;
import java.time.Instant;
import java.util.UUID;
public record SwapOfferResponse(
    UUID id, UUID swapListingId, UUID offererId, UUID offeredCouponId,
    String message, SwapOfferStatus status, Instant createdAt) {}
