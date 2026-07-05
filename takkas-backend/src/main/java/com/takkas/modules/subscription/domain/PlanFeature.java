package com.takkas.modules.subscription.domain;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "plan_features",
    uniqueConstraints = @UniqueConstraint(name = "uq_plan_feature_key",
        columnNames = {"plan_id", "feature_key"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class PlanFeature {

    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private SubscriptionPlan plan;

    @Column(name = "feature_key", nullable = false) private String featureKey;
    @Column(name = "feature_value", nullable = false) private String featureValue;
}
