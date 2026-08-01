package com.takkas.modules.messaging.mapper;

import com.takkas.modules.listing.domain.Listing;
import com.takkas.modules.listing.repository.ListingRepository;
import com.takkas.modules.messaging.api.dto.OfferResponse;
import com.takkas.modules.messaging.domain.Message;
import com.takkas.modules.messaging.domain.Offer;

public final class OfferMapper {

    private OfferMapper() {}

    public static OfferResponse toResponse(Offer offer, Listing listing) {
        String title = listing != null ? listing.getTitle() : null;
        String description = listing != null ? listing.getDescription() : null;
        return new OfferResponse(
            offer.getId(),
            offer.getMessage().getId(),
            offer.getListingId(),
            title,
            description,
            offer.getResultApplicationId(),
            offer.getRewardType(),
            offer.getQuantity(),
            offer.getUnit(),
            offer.getValidityDays(),
            offer.getNote(),
            offer.getStatus(),
            offer.getRespondedAt());
    }

    public static OfferResponse toResponse(Offer offer, Message message, ListingRepository listingRepository) {
        Listing listing = null;
        if (offer.getListingId() != null) {
            listing = listingRepository.findById(offer.getListingId()).orElse(null);
        }
        return new OfferResponse(
            offer.getId(),
            message.getId(),
            offer.getListingId(),
            listing != null ? listing.getTitle() : null,
            listing != null ? listing.getDescription() : null,
            offer.getResultApplicationId(),
            offer.getRewardType(),
            offer.getQuantity(),
            offer.getUnit(),
            offer.getValidityDays(),
            offer.getNote(),
            offer.getStatus(),
            offer.getRespondedAt());
    }
}
