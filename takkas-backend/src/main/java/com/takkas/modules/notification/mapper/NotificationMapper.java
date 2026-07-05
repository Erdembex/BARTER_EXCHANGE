package com.takkas.modules.notification.mapper;

import com.takkas.modules.notification.api.dto.NotificationResponse;
import com.takkas.modules.notification.domain.Notification;

public class NotificationMapper {
    public static NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(n.getId(), n.getType(),
            n.getReferenceId(), n.getReferenceType(),
            n.getTitle(), n.getBody(), n.isRead(), n.getCreatedAt());
    }
}
