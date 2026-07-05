package com.takkas.modules.subscription.api.dto;
import com.takkas.modules.subscription.domain.enums.BillingPeriod;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
public record CheckoutRequest(@NotNull UUID targetPlanId, @NotNull BillingPeriod billingPeriod) {}
