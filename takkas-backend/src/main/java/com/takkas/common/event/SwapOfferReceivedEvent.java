package com.takkas.common.event;
import java.util.UUID;
public record SwapOfferReceivedEvent(
    UUID swapOfferId, UUID swapListingId,
    UUID listingOwnerProfileId, UUID offererProfileId) {}
