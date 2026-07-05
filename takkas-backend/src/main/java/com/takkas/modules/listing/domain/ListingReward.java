package com.takkas.modules.listing.domain;

import com.takkas.modules.listing.domain.enums.RewardType;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "listing_rewards")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ListingReward {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false, unique = true)
    private Listing listing;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RewardType rewardType;

    @Column(nullable = false) private Integer quantity;
    private String unit;
    @Column(nullable = false) private Integer validityDays;
    @Column(columnDefinition = "TEXT") private String description;

    public void update(RewardType rt, Integer qty, String u, Integer vd, String desc) {
        this.rewardType = rt; this.quantity = qty; this.unit = u;
        this.validityDays = vd; this.description = desc;
    }
}
