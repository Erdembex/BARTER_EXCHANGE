package com.takkas.modules.swap.api.dto;
import java.time.Instant;
import java.util.UUID;
public record SwapTradeResponse(
    UUID id, UUID swapListingId, UUID swapOfferId,
    UUID initiatorCouponId, UUID receiverCouponId,
    UUID initiatorNewOwnerId, UUID receiverNewOwnerId, Instant completedAt) {}
