package com.takkas.modules.swap.repository;

import com.takkas.modules.swap.domain.SwapOffer;
import com.takkas.modules.swap.domain.enums.SwapOfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SwapOfferRepository extends JpaRepository<SwapOffer, UUID> {
    List<SwapOffer> findAllBySwapListingIdOrderByCreatedAtDesc(UUID swapListingId);
    List<SwapOffer> findAllByOffererIdOrderByCreatedAtDesc(UUID offererId);
    List<SwapOffer> findAllBySwapListingIdAndStatus(UUID swapListingId, SwapOfferStatus status);
    boolean existsBySwapListingIdAndOffererId(UUID swapListingId, UUID offererId);
    boolean existsByOfferedCouponIdAndStatus(UUID couponId, SwapOfferStatus status);
}
