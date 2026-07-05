package com.takkas.common.event;
import java.util.UUID;
public record SwapCompletedEvent(
    UUID swapTradeId, UUID swapListingId, UUID swapOfferId,
    UUID initiatorProfileId, UUID offererProfileId) {}
