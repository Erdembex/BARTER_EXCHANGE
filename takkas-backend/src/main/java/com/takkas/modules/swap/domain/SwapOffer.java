package com.takkas.modules.swap.domain;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.modules.swap.domain.enums.SwapOfferStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "swap_offers",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_swap_offer_listing_offerer",
        columnNames = {"swap_listing_id", "offerer_id"}),
    indexes = {
        @Index(name = "swap_offers_listing_idx", columnList = "swap_listing_id, status"),
        @Index(name = "swap_offers_offerer_idx", columnList = "offerer_id")
    })
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SwapOffer {

    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "swap_listing_id", nullable = false)
    private SwapListing swapListing;

    @Column(name = "offerer_id",       nullable = false) private UUID offererId;
    @Column(name = "offered_coupon_id", nullable = false) private UUID offeredCouponId;
    @Column(columnDefinition = "TEXT") private String message;

    @Enumerated(EnumType.STRING) @Column(nullable = false)
    @Builder.Default
    private SwapOfferStatus status = SwapOfferStatus.PENDING;

    @CreatedDate private Instant createdAt;

    public void accept() {
        if (status != SwapOfferStatus.PENDING) throw new BusinessRuleException("Bu teklif zaten yanıtlandı.");
        status = SwapOfferStatus.ACCEPTED;
    }

    public void reject() {
        if (status != SwapOfferStatus.PENDING) throw new BusinessRuleException("Bu teklif zaten yanıtlandı.");
        status = SwapOfferStatus.REJECTED;
    }

    public boolean isPending() { return status == SwapOfferStatus.PENDING; }
}
