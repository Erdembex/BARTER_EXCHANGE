package com.takkas.modules.messaging.api.dto;
import com.takkas.modules.messaging.domain.enums.ConversationStatus;
import java.time.Instant;
import java.util.UUID;
public record ConversationResponse(UUID id, UUID applicationId,
    UUID businessUserId, UUID individualUserId,
    ConversationStatus status, int unreadCount, Instant createdAt) {}
