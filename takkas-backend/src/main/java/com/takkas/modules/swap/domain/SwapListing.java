package com.takkas.modules.swap.domain;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.modules.listing.domain.enums.RewardType;
import com.takkas.modules.swap.domain.enums.SwapListingStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "swap_listings", indexes = {
    @Index(name = "swap_listings_status_reward_idx", columnList = "status, wanted_reward_type"),
    @Index(name = "swap_listings_owner_idx",          columnList = "owner_id"),
    @Index(name = "swap_listings_coupon_idx",          columnList = "offered_coupon_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SwapListing {

    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "owner_id",         nullable = false) private UUID ownerId;
    @Column(name = "offered_coupon_id", nullable = false, unique = true) private UUID offeredCouponId;

    @Enumerated(EnumType.STRING)
    @Column(name = "wanted_reward_type", nullable = false)
    private RewardType wantedRewardType;

    @Column(name = "wanted_quantity", nullable = false) private Integer wantedQuantity;
    @Column(name = "wanted_description", columnDefinition = "TEXT") private String wantedDescription;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    @Builder.Default
    private SwapListingStatus status = SwapListingStatus.OPEN;

    @CreatedDate private Instant createdAt;
    private Instant expiresAt;

    public void match() {
        if (status != SwapListingStatus.OPEN)
            throw new BusinessRuleException("Sadece açık ilanlar eşleştirilebilir.");
        status = SwapListingStatus.MATCHED;
    }

    public void cancel() {
        if (status != SwapListingStatus.OPEN)
            throw new BusinessRuleException("Sadece açık ilanlar iptal edilebilir.");
        status = SwapListingStatus.CANCELLED;
    }

    public void expire() { if (status == SwapListingStatus.OPEN) status = SwapListingStatus.EXPIRED; }
    public boolean isOpen() { return status == SwapListingStatus.OPEN; }
    public boolean isOwnedBy(UUID userId) { return ownerId.equals(userId); }
}
