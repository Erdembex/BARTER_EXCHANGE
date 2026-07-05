package com.takkas.modules.messaging.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageBufferService {

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String BUFFER_KEY  = "message:buffer:%s";
    private static final String UNREAD_KEY  = "conversation:%s:unread:%s";
    private static final String TYPING_KEY  = "conversation:%s:typing:%s";
    private static final String ONLINE_KEY  = "user:%s:online";

    public void bufferMessage(MessageBufferItem item) {
        try {
            redisTemplate.opsForList().rightPush(
                BUFFER_KEY.formatted(item.conversationId()),
                objectMapper.writeValueAsString(item));
        } catch (JsonProcessingException e) {
            log.error("[MessageBufferService] Buffer yazma hatası: {}", e.getMessage());
        }
    }

    public List<MessageBufferItem> drainBuffer(UUID conversationId) {
        String key = BUFFER_KEY.formatted(conversationId);
        List<String> raw = redisTemplate.opsForList().range(key, 0, -1);
        redisTemplate.delete(key);
        if (raw == null) return List.of();
        return raw.stream().map(json -> {
            try { return objectMapper.readValue(json, MessageBufferItem.class); }
            catch (JsonProcessingException e) { return null; }
        }).filter(Objects::nonNull).toList();
    }

    public void incrementUnread(UUID conversationId, UUID userId) {
        redisTemplate.opsForValue().increment(UNREAD_KEY.formatted(conversationId, userId));
    }

    public int getUnreadCount(UUID conversationId, UUID userId) {
        String val = redisTemplate.opsForValue().get(UNREAD_KEY.formatted(conversationId, userId));
        return val == null ? 0 : Integer.parseInt(val);
    }

    public void clearUnread(UUID conversationId, UUID userId) {
        redisTemplate.delete(UNREAD_KEY.formatted(conversationId, userId));
    }

    public void setTyping(UUID conversationId, UUID userId) {
        redisTemplate.opsForValue().set(TYPING_KEY.formatted(conversationId, userId), "1", Duration.ofSeconds(5));
    }

    public void heartbeat(UUID userId) {
        redisTemplate.opsForValue().set(ONLINE_KEY.formatted(userId), "1", Duration.ofSeconds(30));
    }

    public record MessageBufferItem(UUID id, UUID conversationId,
                                     UUID senderId, String content, Instant createdAt) {}
}
