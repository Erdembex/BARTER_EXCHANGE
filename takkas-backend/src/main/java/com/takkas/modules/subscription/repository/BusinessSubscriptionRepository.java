package com.takkas.modules.subscription.repository;

import com.takkas.modules.subscription.domain.BusinessSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BusinessSubscriptionRepository extends JpaRepository<BusinessSubscription, UUID> {
    Optional<BusinessSubscription> findByBusinessId(UUID businessId);
    Optional<BusinessSubscription> findByStripeSubscriptionId(String stripeSubId);
    Optional<BusinessSubscription> findByStripeCustomerId(String customerId);

    @Query("SELECT s FROM BusinessSubscription s WHERE s.status = 'PAST_DUE' AND s.pastDueSince < :threshold")
    List<BusinessSubscription> findExpiredGracePeriod(@Param("threshold") Instant threshold);

    @Query("SELECT s FROM BusinessSubscription s WHERE s.cancelAtPeriodEnd = true AND s.currentPeriodEnd < :now AND s.status = 'ACTIVE'")
    List<BusinessSubscription> findDueCancellations(@Param("now") Instant now);
}
