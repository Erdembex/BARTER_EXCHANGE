package com.takkas.modules.subscription.domain;

import com.takkas.modules.subscription.domain.enums.BillingPeriod;
import com.takkas.modules.subscription.domain.enums.SubscriptionStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "business_subscriptions")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class BusinessSubscription {

    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "business_id", nullable = false, unique = true) private UUID businessId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    private String stripeCustomerId;
    private String stripeSubscriptionId;
    private Instant currentPeriodStart;
    private Instant currentPeriodEnd;
    @Column(nullable = false) @Builder.Default private boolean cancelAtPeriodEnd = false;
    private Instant pastDueSince;

    // Ödeme sağlayıcısından (şu an: manuel onay, ileride: sanal POS) bağımsız "yükseltme talebi" izi.
    // Talep oluşturulduğunda mevcut plan/erişim değişmez; yalnızca admin onayı ile aktive olur.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pending_plan_id")
    private SubscriptionPlan pendingPlan;

    @Enumerated(EnumType.STRING)
    @Column(name = "pending_billing_period")
    private BillingPeriod pendingBillingPeriod;

    @Column(name = "pending_reference")
    private String pendingReference;

    @Column(name = "pending_requested_at")
    private Instant pendingRequestedAt;

    @CreatedDate  private Instant createdAt;
    @LastModifiedDate private Instant updatedAt;

    public void activate(SubscriptionPlan plan, String subId, Instant start, Instant end) {
        this.plan = plan; this.stripeSubscriptionId = subId;
        this.status = SubscriptionStatus.ACTIVE;
        this.currentPeriodStart = start; this.currentPeriodEnd = end;
        this.pastDueSince = null; this.cancelAtPeriodEnd = false;
        clearPendingUpgrade();
    }

    public void requestUpgrade(SubscriptionPlan targetPlan, BillingPeriod period, String reference) {
        this.pendingPlan = targetPlan;
        this.pendingBillingPeriod = period;
        this.pendingReference = reference;
        this.pendingRequestedAt = Instant.now();
    }

    public void clearPendingUpgrade() {
        this.pendingPlan = null;
        this.pendingBillingPeriod = null;
        this.pendingReference = null;
        this.pendingRequestedAt = null;
    }

    public boolean hasPendingUpgrade() {
        return pendingPlan != null;
    }

    public void markPastDue() { status = SubscriptionStatus.PAST_DUE; pastDueSince = Instant.now(); }
    public void cancel()      { status = SubscriptionStatus.CANCELLED; }
    public void scheduleCancel() { cancelAtPeriodEnd = true; }

    public boolean isGracePeriodExpired() {
        if (pastDueSince == null) return false;
        return Instant.now().isAfter(pastDueSince.plus(3, ChronoUnit.DAYS));
    }

    public boolean isPaid() {
        return status == SubscriptionStatus.ACTIVE || status == SubscriptionStatus.TRIALING;
    }
}
