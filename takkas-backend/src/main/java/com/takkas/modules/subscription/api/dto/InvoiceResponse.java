package com.takkas.modules.subscription.api.dto;
import com.takkas.modules.subscription.domain.enums.InvoiceStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
public record InvoiceResponse(UUID id, BigDecimal amount, String currency,
    InvoiceStatus status, String invoiceUrl, Instant paidAt, Instant createdAt) {}
