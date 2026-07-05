package com.takkas.modules.listing.repository;

import com.takkas.modules.listing.domain.Listing;
import com.takkas.modules.listing.domain.enums.ListingStatus;
import com.takkas.modules.user.domain.enums.Skill;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ListingRepository extends JpaRepository<Listing, UUID> {

    List<Listing> findAllByBusinessIdOrderByCreatedAtDesc(UUID businessId);

    List<Listing> findAllByStatusOrderByCreatedAtDesc(ListingStatus status);

    long countByBusinessIdAndStatus(UUID businessId, ListingStatus status);

    boolean existsByIdAndBusinessId(UUID listingId, UUID businessId);

    @Query("""
        SELECT DISTINCT l FROM Listing l
        JOIN l.business b
        LEFT JOIN l.skills s
        WHERE l.status = 'ACTIVE'
          AND (:city IS NULL OR b.city = :city)
          AND (:district IS NULL OR b.district = :district)
          AND (:#{#skills == null || #skills.isEmpty()} = true OR s.skill IN :skills)
          AND l.createdAt < :cursor
        ORDER BY l.createdAt DESC
        """)
    List<Listing> findActiveListingsForDiscover(
        @Param("city") String city,
        @Param("district") String district,
        @Param("skills") List<Skill> skills,
        @Param("cursor") Instant cursor,
        Pageable pageable);

    @Query("SELECT l FROM Listing l WHERE l.status = 'ACTIVE' AND l.expiresAt IS NOT NULL AND l.expiresAt < :now")
    List<Listing> findExpiredActiveListings(@Param("now") Instant now);

    @Modifying
    @Query("UPDATE Listing l SET l.viewCount = l.viewCount + :count WHERE l.id = :id")
    void incrementViewCount(@Param("id") UUID id, @Param("count") int count);
}
