package com.takkas.modules.messaging.api.dto;
import java.util.UUID;
public record TypingEvent(UUID userId, UUID conversationId, boolean isTyping) {}
