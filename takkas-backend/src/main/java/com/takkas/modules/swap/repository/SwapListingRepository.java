package com.takkas.modules.swap.repository;

import com.takkas.modules.listing.domain.enums.RewardType;
import com.takkas.modules.swap.domain.SwapListing;
import com.takkas.modules.swap.domain.enums.SwapListingStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface SwapListingRepository extends JpaRepository<SwapListing, UUID> {

    @Query("""
        SELECT s FROM SwapListing s
        WHERE s.status = 'OPEN'
          AND s.ownerId != :requesterId
          AND s.createdAt < :cursor
        ORDER BY s.createdAt DESC
        """)
    List<SwapListing> findOpenForDiscover(@Param("requesterId") UUID requesterId,
                                          @Param("cursor") Instant cursor,
                                          Pageable pageable);

    @Query("""
        SELECT s FROM SwapListing s
        WHERE s.status = 'OPEN'
          AND s.wantedRewardType = :rewardType
          AND s.ownerId != :requesterId
          AND s.createdAt < :cursor
        ORDER BY s.createdAt DESC
        """)
    List<SwapListing> findOpenForDiscoverByRewardType(@Param("rewardType") RewardType rewardType,
                                                      @Param("requesterId") UUID requesterId,
                                                      @Param("cursor") Instant cursor,
                                                      Pageable pageable);

    List<SwapListing> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    boolean existsByOfferedCouponIdAndStatus(UUID couponId, SwapListingStatus status);

    @Query("SELECT s FROM SwapListing s WHERE s.status = 'OPEN' AND s.expiresAt IS NOT NULL AND s.expiresAt < :now")
    List<SwapListing> findExpiredOpenListings(@Param("now") Instant now);
}
