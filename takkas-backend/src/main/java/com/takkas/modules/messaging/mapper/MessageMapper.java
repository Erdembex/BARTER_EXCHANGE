package com.takkas.modules.messaging.mapper;

import com.takkas.modules.messaging.api.dto.MessageResponse;
import com.takkas.modules.messaging.domain.Message;

public class MessageMapper {
    public static MessageResponse toResponse(Message m) {
        return new MessageResponse(m.getId(), m.getConversation().getId(),
            m.getSenderId(), m.getMessageType(), m.getContent(),
            m.getCreatedAt(), m.isRead());
    }
}
