package com.takkas.modules.subscription.repository;

import com.takkas.modules.subscription.domain.SubscriptionPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionPlanRepository extends JpaRepository<SubscriptionPlan, UUID> {
    Optional<SubscriptionPlan> findByName(String name);

    @Query("SELECT p FROM SubscriptionPlan p LEFT JOIN FETCH p.features WHERE p.isActive = true")
    List<SubscriptionPlan> findAllActiveWithFeatures();
}
