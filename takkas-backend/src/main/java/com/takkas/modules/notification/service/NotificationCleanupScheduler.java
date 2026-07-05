package com.takkas.modules.notification.service;

import com.takkas.modules.notification.repository.NotificationRepository;
import com.takkas.infrastructure.push.FcmTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationCleanupScheduler {

    private final NotificationRepository notificationRepository;
    private final FcmTokenRepository fcmTokenRepository;

    @Scheduled(cron = "0 0 5 * * *", zone = "Europe/Istanbul")
    @Transactional
    public void cleanOldNotifications() {
        Instant threshold = Instant.now().minus(90, ChronoUnit.DAYS);
        int deleted = notificationRepository.deleteOldReadNotifications(threshold);
        log.info("[NotificationCleanupScheduler] {} eski bildirim silindi.", deleted);
    }

    @Scheduled(cron = "0 0 3 * * SUN", zone = "Europe/Istanbul")
    @Transactional
    public void cleanInactiveFcmTokens() {
        Instant threshold = Instant.now().minus(180, ChronoUnit.DAYS);
        int deleted = fcmTokenRepository.deleteInactiveTokensOlderThan(threshold);
        log.info("[NotificationCleanupScheduler] {} eski FCM token silindi.", deleted);
    }
}
