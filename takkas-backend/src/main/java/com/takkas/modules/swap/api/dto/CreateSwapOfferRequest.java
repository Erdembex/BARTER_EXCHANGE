package com.takkas.modules.swap.api.dto;
import jakarta.validation.constraints.*;
import java.util.UUID;
public record CreateSwapOfferRequest(
    @NotNull UUID offeredCouponId,
    @Size(max = 300) String message) {}
