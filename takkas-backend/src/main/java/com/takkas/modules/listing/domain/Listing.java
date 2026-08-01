package com.takkas.modules.listing.domain;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.modules.listing.domain.enums.*;
import com.takkas.modules.user.domain.BusinessProfile;
import com.takkas.modules.user.domain.IndividualProfile;
import com.takkas.modules.user.domain.enums.Skill;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "listings", indexes = {
    @Index(name = "listings_business_status_idx", columnList = "business_id, status"),
    @Index(name = "listings_status_idx", columnList = "status")
})
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Listing {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "business_id", nullable = false)
    private BusinessProfile business;

    @Column(nullable = false) private String title;
    @Column(columnDefinition = "TEXT") private String description;

    @Enumerated(EnumType.STRING) private WeeklyHours weeklyHours;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ListingVisibility visibility = ListingVisibility.PUBLIC;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_individual_id")
    private IndividualProfile targetIndividual;

    @Column(name = "source_conversation_id")
    private UUID sourceConversationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ListingStatus status = ListingStatus.DRAFT;

    @Column(nullable = false) @Builder.Default private Integer viewCount = 0;

    @OneToOne(mappedBy = "listing", cascade = CascadeType.ALL,
              orphanRemoval = true, fetch = FetchType.LAZY)
    private ListingReward reward;

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ListingSkill> skills = new ArrayList<>();

    @CreatedDate  private Instant createdAt;
    @LastModifiedDate private Instant updatedAt;
    private Instant expiresAt;

    public void publish() {
        if (status != ListingStatus.DRAFT)
            throw new BusinessRuleException("Sadece taslak ilanlar yayınlanabilir.");
        status = ListingStatus.ACTIVE;
    }

    /** Özel (sohbet) ilanları doğrudan aktif yapar */
    public void publishPrivate() {
        if (visibility != ListingVisibility.PRIVATE)
            throw new BusinessRuleException("Yalnızca özel ilanlar bu yöntemle yayınlanabilir.");
        if (status != ListingStatus.DRAFT)
            throw new BusinessRuleException("Özel ilan zaten yayınlandı.");
        status = ListingStatus.ACTIVE;
    }

    public boolean isPrivate() { return visibility == ListingVisibility.PRIVATE; }

    public void close() {
        if (status != ListingStatus.ACTIVE)
            throw new BusinessRuleException("Sadece aktif ilanlar kapatılabilir.");
        status = ListingStatus.CLOSED;
    }

    public void expire() {
        if (status == ListingStatus.ACTIVE) status = ListingStatus.EXPIRED;
    }

    public boolean isActive() { return status == ListingStatus.ACTIVE; }

    /** Aktif ve son başvuru tarihi geçmemiş */
    public boolean isOpenForApplications() {
        if (status != ListingStatus.ACTIVE) return false;
        if (expiresAt != null && !Instant.now().isBefore(expiresAt)) return false;
        return true;
    }

    public void addSkill(Skill skill) {
        if (skills.stream().noneMatch(s -> s.getSkill() == skill))
            skills.add(new ListingSkill(this, skill));
    }

    public void updateSkills(List<Skill> newSkills) {
        skills.clear();
        newSkills.forEach(this::addSkill);
    }

    public void setReward(ListingReward reward) {
        reward.setListing(this);
        this.reward = reward;
    }
}
