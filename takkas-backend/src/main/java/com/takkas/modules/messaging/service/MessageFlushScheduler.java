package com.takkas.modules.messaging.service;

import com.takkas.modules.messaging.domain.*;
import com.takkas.modules.messaging.domain.enums.MessageType;
import com.takkas.modules.messaging.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class MessageFlushScheduler {

    private final RedisTemplate<String, String> redisTemplate;
    private final MessageBufferService bufferService;
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;

    @Scheduled(fixedDelay = 2000)
    @Transactional
    public void flushBuffers() {
        Set<String> keys = redisTemplate.keys("message:buffer:*");
        if (keys == null || keys.isEmpty()) return;
        keys.forEach(key -> {
            UUID cid = UUID.fromString(key.replace("message:buffer:", ""));
            flushConversation(cid);
        });
    }

    private void flushConversation(UUID cid) {
        var items = bufferService.drainBuffer(cid);
        if (items.isEmpty()) return;
        try {
            var conv = conversationRepository.findById(cid).orElse(null);
            if (conv == null) return;
            var messages = items.stream().map(item -> Message.builder()
                .conversation(conv).senderId(item.senderId())
                .messageType(MessageType.TEXT).content(item.content()).isRead(false).build()).toList();
            messageRepository.saveAll(messages);
        } catch (Exception e) {
            log.error("[MessageFlushScheduler] Flush hatası cid={}: {}", cid, e.getMessage());
            items.forEach(bufferService::bufferMessage);
        }
    }
}
