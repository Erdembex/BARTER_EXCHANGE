package com.takkas.infrastructure.push;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FcmPushService implements PushNotificationService {

    private final FcmTokenRepository fcmTokenRepository;

    @Override
    @Async("pushNotificationExecutor")
    public void sendAsync(UUID userId, String title, String body, Map<String, String> data) {
        if (FirebaseApp.getApps().isEmpty()) {
            log.debug("[FcmPushService] Firebase başlatılmadı, bildirim atlandı: userId={}", userId);
            return;
        }
        List<String> tokens = fcmTokenRepository.findActiveTokensByUserId(userId);
        if (tokens.isEmpty()) {
            log.debug("[FcmPushService] Token bulunamadı: userId={}", userId);
            return;
        }
        for (String token : tokens) {
            try {
                sendToToken(token, title, body, data);
            } catch (FirebaseMessagingException e) {
                if (isInvalidToken(e)) {
                    fcmTokenRepository.deleteByToken(token);
                    log.info("[FcmPushService] Geçersiz token silindi.");
                } else {
                    log.error("[FcmPushService] Gönderim hatası: {}", e.getMessage());
                }
            }
        }
    }

    private void sendToToken(String token, String title, String body,
                              Map<String, String> data) throws FirebaseMessagingException {
        Message message = Message.builder()
            .setToken(token)
            .setNotification(Notification.builder().setTitle(title).setBody(body).build())
            .putAllData(data)
            .setAndroidConfig(AndroidConfig.builder()
                .setPriority(AndroidConfig.Priority.HIGH).build())
            .setApnsConfig(ApnsConfig.builder()
                .setAps(Aps.builder().setSound("default").setBadge(1).build()).build())
            .build();
        FirebaseMessaging.getInstance().send(message);
        log.debug("[FcmPushService] Push gönderildi: token={}...", token.substring(0, 10));
    }

    private boolean isInvalidToken(FirebaseMessagingException e) {
        return e.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED
            || e.getMessagingErrorCode() == MessagingErrorCode.INVALID_ARGUMENT;
    }
}
