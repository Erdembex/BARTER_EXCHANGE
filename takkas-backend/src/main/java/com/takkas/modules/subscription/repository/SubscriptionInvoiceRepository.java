package com.takkas.modules.subscription.repository;

import com.takkas.modules.subscription.domain.SubscriptionInvoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionInvoiceRepository extends JpaRepository<SubscriptionInvoice, UUID> {
    Optional<SubscriptionInvoice> findByStripeInvoiceId(String stripeInvoiceId);
    List<SubscriptionInvoice> findAllBySubscriptionIdOrderByCreatedAtDesc(UUID subscriptionId);
}
