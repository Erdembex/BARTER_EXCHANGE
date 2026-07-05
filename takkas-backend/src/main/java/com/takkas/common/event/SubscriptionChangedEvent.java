package com.takkas.common.event;
import java.util.UUID;
public record SubscriptionChangedEvent(
    UUID businessId, String oldPlanName, String newPlanName) {}
