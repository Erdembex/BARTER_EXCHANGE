package com.takkas.modules.swap.api.dto;

import java.time.Instant;
import java.util.UUID;

public record SwapOfferMessageResponse(
    UUID id,
    UUID swapOfferId,
    UUID senderId,
    String body,
    Instant createdAt,
    boolean mine
) {}
