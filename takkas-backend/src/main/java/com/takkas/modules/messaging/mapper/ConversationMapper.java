package com.takkas.modules.messaging.mapper;

import com.takkas.modules.messaging.api.dto.ConversationResponse;
import com.takkas.modules.messaging.domain.Conversation;

public class ConversationMapper {
    public static ConversationResponse toResponse(Conversation c, int unreadCount) {
        return new ConversationResponse(c.getId(), c.getApplicationId(),
            c.getBusinessUserId(), c.getIndividualUserId(),
            c.getStatus(), unreadCount, c.getCreatedAt());
    }
}
