package com.takkas.modules.messaging.config;

import com.takkas.modules.messaging.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.*;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final ConversationRepository conversationRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor acc = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (acc == null) return message;
        if (StompCommand.SUBSCRIBE.equals(acc.getCommand())) {
            String dest = acc.getDestination();
            if (dest != null && dest.startsWith("/topic/conversation/")) {
                UUID conversationId = UUID.fromString(dest.split("/")[3]);
                UUID userId = getUserId(acc);
                if (!conversationRepository.isParticipant(conversationId, userId))
                    throw new org.springframework.messaging.MessagingException("Bu konuşmaya erişim yetkiniz yok.");
            }
        }
        return message;
    }

    private UUID getUserId(StompHeaderAccessor acc) {
        Map<String, Object> attrs = acc.getSessionAttributes();
        if (attrs == null) throw new org.springframework.messaging.MessagingException("Oturum bulunamadı.");
        return (UUID) attrs.get("userId");
    }
}
