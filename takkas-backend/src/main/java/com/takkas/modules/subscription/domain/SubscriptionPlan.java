package com.takkas.modules.subscription.domain;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "subscription_plans")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SubscriptionPlan {

    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable = false, unique = true) private String name;
    @Column(nullable = false) private String displayName;
    @Column(nullable = false) @Builder.Default private BigDecimal priceMonthly = BigDecimal.ZERO;
    @Column(nullable = false, columnDefinition = "numeric(19,2) default 0")
    @Builder.Default private BigDecimal priceSemiAnnual = BigDecimal.ZERO;
    @Column(nullable = false) @Builder.Default private BigDecimal priceYearly  = BigDecimal.ZERO;

    // Stripe alanları şu an kullanılmıyor (aktif ödeme sağlayıcısı ManualPaymentGateway).
    // Gerçek bir sanal POS/ödeme altyapısı bağlanınca PaymentGateway arayüzünün yeni bir
    // implementasyonu bu alanları (veya eşdeğerlerini) doldurup kullanabilir.
    private String stripePriceIdMonthly;
    private String stripePriceIdSemiAnnual;
    private String stripePriceIdYearly;
    @Column(nullable = false) @Builder.Default private boolean isActive = true;

    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL,
               orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<PlanFeature> features = new ArrayList<>();

    @CreatedDate private Instant createdAt;
}
