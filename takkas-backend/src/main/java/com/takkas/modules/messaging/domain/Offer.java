package com.takkas.modules.messaging.domain;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.modules.listing.domain.enums.RewardType;
import com.takkas.modules.messaging.domain.enums.OfferStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "offers")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Offer {

    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false, unique = true)
    private Message message;

    @Enumerated(EnumType.STRING) private RewardType rewardType;
    private Integer quantity;
    private String unit;
    private Integer validityDays;
    @Column(columnDefinition = "TEXT") private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OfferStatus status = OfferStatus.PENDING;

    private Instant respondedAt;

    public void accept() {
        if (status != OfferStatus.PENDING) throw new BusinessRuleException("Bu teklif zaten yanıtlandı.");
        status = OfferStatus.ACCEPTED; respondedAt = Instant.now();
    }

    public void reject() {
        if (status != OfferStatus.PENDING) throw new BusinessRuleException("Bu teklif zaten yanıtlandı.");
        status = OfferStatus.REJECTED; respondedAt = Instant.now();
    }

    public void counter() { status = OfferStatus.COUNTERED; respondedAt = Instant.now(); }

    public boolean isPending() { return status == OfferStatus.PENDING; }
}
