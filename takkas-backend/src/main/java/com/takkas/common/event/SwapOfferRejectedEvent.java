package com.takkas.common.event;
import java.util.UUID;
public record SwapOfferRejectedEvent(
    UUID swapOfferId, UUID swapListingId, UUID offererProfileId) {}
