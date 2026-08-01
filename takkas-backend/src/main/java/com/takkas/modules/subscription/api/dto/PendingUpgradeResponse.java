package com.takkas.modules.subscription.api.dto;
import com.takkas.modules.subscription.domain.enums.BillingPeriod;
import java.time.Instant;
import java.util.UUID;
public record PendingUpgradeResponse(
    UUID businessId, String businessName,
    String currentPlanDisplayName,
    String targetPlanName, String targetPlanDisplayName,
    BillingPeriod billingPeriod, String reference, Instant requestedAt) {}
