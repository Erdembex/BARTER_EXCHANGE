package com.takkas.modules.swap.domain;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "swap_trades")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SwapTrade {

    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "swap_listing_id", nullable = false, unique = true)
    private SwapListing swapListing;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "swap_offer_id", nullable = false, unique = true)
    private SwapOffer swapOffer;

    @Column(name = "initiator_coupon_id",  nullable = false) private UUID initiatorCouponId;
    @Column(name = "receiver_coupon_id",   nullable = false) private UUID receiverCouponId;
    @Column(name = "initiator_new_owner_id", nullable = false) private UUID initiatorNewOwnerId;
    @Column(name = "receiver_new_owner_id",  nullable = false) private UUID receiverNewOwnerId;

    @CreatedDate private Instant completedAt;
}
