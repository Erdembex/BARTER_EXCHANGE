package com.takkas.modules.subscription.api.dto;
import com.takkas.modules.subscription.domain.enums.BillingPeriod;
import com.takkas.modules.subscription.domain.enums.SubscriptionStatus;
import java.time.Instant;
import java.util.UUID;
public record SubscriptionResponse(UUID id, String planName, String planDisplayName,
    SubscriptionStatus status, boolean cancelAtPeriodEnd,
    Instant currentPeriodStart, Instant currentPeriodEnd,
    String pendingPlanName, String pendingPlanDisplayName,
    BillingPeriod pendingBillingPeriod, String pendingReference, Instant pendingRequestedAt) {}
