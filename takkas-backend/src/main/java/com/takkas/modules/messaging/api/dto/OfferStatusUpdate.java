package com.takkas.modules.messaging.api.dto;
import com.takkas.modules.messaging.domain.enums.OfferStatus;
import java.util.UUID;
public record OfferStatusUpdate(UUID offerId, OfferStatus status) {}
