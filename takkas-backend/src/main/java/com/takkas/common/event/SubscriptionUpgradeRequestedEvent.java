package com.takkas.common.event;
import java.util.UUID;
public record SubscriptionUpgradeRequestedEvent(
    UUID businessId, String businessName, String targetPlanDisplayName, String reference) {}
