package com.takkas.modules.listing;

import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.listing.domain.Listing;
import com.takkas.modules.listing.domain.enums.RewardType;
import com.takkas.modules.listing.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ListingFacade {

    private final ListingRepository listingRepository;

    @Transactional
    public boolean isListingActive(UUID listingId) {
        return listingRepository.findById(listingId)
            .map(this::syncExpiryAndCheckOpen)
            .orElse(false);
    }

    private boolean syncExpiryAndCheckOpen(Listing listing) {
        if (listing.getExpiresAt() != null
            && !Instant.now().isBefore(listing.getExpiresAt())
            && listing.isActive()) {
            listing.expire();
            listingRepository.save(listing);
            return false;
        }
        return listing.isOpenForApplications();
    }

    public RewardInfo getRewardByListingId(UUID listingId) {
        return listingRepository.findById(listingId).map(l -> new RewardInfo(
            l.getReward().getRewardType(), l.getReward().getQuantity(),
            l.getReward().getUnit(), l.getReward().getValidityDays(),
            l.getReward().getDescription()
        )).orElseThrow(() -> new ResourceNotFoundException("İlan bulunamadı."));
    }

    public UUID getBusinessIdByListingId(UUID listingId) {
        return listingRepository.findById(listingId)
            .map(l -> l.getBusiness().getId())
            .orElseThrow(() -> new ResourceNotFoundException("İlan bulunamadı."));
    }

    public record RewardInfo(RewardType rewardType, int quantity,
                              String unit, int validityDays, String description) {}
}
