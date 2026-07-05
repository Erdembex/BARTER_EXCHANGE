package com.takkas.modules.listing.domain;

import com.takkas.modules.user.domain.enums.Skill;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "listing_skills",
    uniqueConstraints = @UniqueConstraint(columnNames = {"listing_id","skill"}))
@Getter @Setter @NoArgsConstructor
public class ListingSkill {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Skill skill;

    public ListingSkill(Listing listing, Skill skill) {
        this.listing = listing; this.skill = skill;
    }
}
