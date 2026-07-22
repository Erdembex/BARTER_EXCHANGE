package com.takkas.modules.notification.service;

import com.takkas.common.pagination.PageResponse;
import com.takkas.modules.notification.api.dto.NotificationResponse;
import com.takkas.modules.notification.domain.Notification;
import com.takkas.modules.notification.mapper.NotificationMapper;
import com.takkas.modules.notification.repository.NotificationRepository;
import com.takkas.infrastructure.push.PushNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final PushNotificationService pushService;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String UNREAD_KEY = "user:%s:unread_notifications";

    @Transactional
    public Notification create(Notification notification) {
        Notification saved = notificationRepository.save(notification);
        incrementUnread(saved.getUserId());
        pushService.sendAsync(saved.getUserId(), saved.getTitle(), saved.getBody(),
            buildPushData(saved));
        return saved;
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getNotifications(UUID userId,
                                                                 Instant cursor,
                                                                 int pageSize) {
        var list = notificationRepository.findByUserWithCursor(
            userId, cursor, PageRequest.of(0, pageSize));
        var nextCursor = list.isEmpty() ? null : list.getLast().getCreatedAt();
        return PageResponse.of(list.stream().map(NotificationMapper::toResponse).toList(), nextCursor);
    }

    public int getUnreadCount(UUID userId) {
        String val = redisTemplate.opsForValue().get(UNREAD_KEY.formatted(userId));
        if (val != null) return Integer.parseInt(val);
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        redisTemplate.opsForValue().set(UNREAD_KEY.formatted(userId), String.valueOf(count));
        return (int) count;
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.markAllReadByUserId(userId);
        redisTemplate.delete(UNREAD_KEY.formatted(userId));
    }

    @Transactional
    public void markReadByReference(UUID userId, UUID referenceId) {
        int updated = notificationRepository.markReadByReference(userId, referenceId);
        if (updated > 0) {
            syncUnreadCount(userId);
        }
    }

    @Transactional
    public void markReadById(UUID userId, UUID notificationId) {
        int updated = notificationRepository.markReadById(userId, notificationId);
        if (updated > 0) {
            syncUnreadCount(userId);
        }
    }

    private void syncUnreadCount(UUID userId) {
        long count = notificationRepository.countByUserIdAndIsReadFalse(userId);
        redisTemplate.opsForValue().set(UNREAD_KEY.formatted(userId), String.valueOf(count));
    }

    private void incrementUnread(UUID userId) {
        redisTemplate.opsForValue().increment(UNREAD_KEY.formatted(userId));
    }

    private Map<String, String> buildPushData(Notification n) {
        Map<String, String> data = new HashMap<>();
        data.put("notificationId", n.getId().toString());
        data.put("type", n.getType().name());
        if (n.getReferenceId() != null) {
            data.put("referenceId",   n.getReferenceId().toString());
            data.put("referenceType", n.getReferenceType());
        }
        return data;
    }
}
