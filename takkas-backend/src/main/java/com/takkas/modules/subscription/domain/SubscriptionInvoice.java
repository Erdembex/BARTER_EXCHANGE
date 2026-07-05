package com.takkas.modules.subscription.domain;

import com.takkas.modules.subscription.domain.enums.InvoiceStatus;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "subscription_invoices")
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SubscriptionInvoice {

    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    private BusinessSubscription subscription;

    @Column(unique = true, nullable = false) private String stripeInvoiceId;
    @Column(nullable = false) private BigDecimal amount;
    @Column(nullable = false) @Builder.Default private String currency = "TRY";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status;

    private String invoiceUrl;
    private Instant paidAt;
    @CreatedDate private Instant createdAt;
}
