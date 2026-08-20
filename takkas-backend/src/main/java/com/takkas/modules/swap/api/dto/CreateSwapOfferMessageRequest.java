package com.takkas.modules.swap.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSwapOfferMessageRequest(
    @NotBlank @Size(max = 2000) String body
) {}
