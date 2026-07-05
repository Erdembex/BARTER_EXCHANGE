package com.takkas.modules.subscription.api.dto;
import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
public record PlanResponse(UUID id, String name, String displayName,
    BigDecimal priceMonthly, BigDecimal priceYearly, Map<String, String> features) {}
