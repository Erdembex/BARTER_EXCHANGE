package com.takkas.modules.messaging.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.modules.messaging.api.dto.MessageResponse;
import com.takkas.modules.messaging.domain.Conversation;
import com.takkas.modules.messaging.domain.Message;
import com.takkas.modules.messaging.domain.enums.MessageType;
import com.takkas.modules.messaging.mapper.MessageMapper;
import com.takkas.modules.messaging.repository.ConversationRepository;
import com.takkas.modules.messaging.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final MessageBufferService bufferService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public MessageResponse sendText(UUID conversationId, UUID senderId, String content) {
        String trimmed = content == null ? "" : content.trim();
        if (trimmed.isEmpty()) {
            throw new BusinessRuleException("Mesaj boş olamaz.");
        }
        if (trimmed.length() > 1000) {
            throw new BusinessRuleException("Mesaj en fazla 1000 karakter olabilir.");
        }

        Conversation conv = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new BusinessRuleException("Konuşma bulunamadı."));
        if (!conv.isParticipant(senderId)) {
            throw new BusinessRuleException("Erişim yetkiniz yok.");
        }
        if (!conv.isWritable()) {
            throw new BusinessRuleException("Bu konuşmaya mesaj gönderilemez.");
        }

        Instant now = Instant.now();
        Message saved = messageRepository.save(Message.builder()
            .id(UUID.randomUUID())
            .conversation(conv)
            .senderId(senderId)
            .messageType(MessageType.TEXT)
            .content(trimmed)
            .createdAt(now)
            .isRead(false)
            .build());

        UUID recipientId = conv.getBusinessUserId().equals(senderId)
            ? conv.getIndividualUserId() : conv.getBusinessUserId();
        bufferService.incrementUnread(conversationId, recipientId);

        MessageResponse response = MessageMapper.toResponse(saved);
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, response);
        return response;
    }
}
