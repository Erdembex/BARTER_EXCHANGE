package com.takkas.common.event;
import java.time.Instant;
import java.util.UUID;
public record CouponExpiringSoonEvent(
    UUID couponId, UUID ownerId, Instant expiresAt) {}
