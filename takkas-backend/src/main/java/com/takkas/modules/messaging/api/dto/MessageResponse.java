package com.takkas.modules.messaging.api.dto;
import com.takkas.modules.messaging.domain.enums.MessageType;
import java.time.Instant;
import java.util.UUID;
public record MessageResponse(UUID id, UUID conversationId, UUID senderId,
    MessageType messageType, String content, Instant createdAt, boolean isRead) {}
