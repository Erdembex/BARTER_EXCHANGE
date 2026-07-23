package com.takkas.infrastructure.push;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Primary
@RequiredArgsConstructor
@Slf4j
public class CompositePushNotificationService implements PushNotificationService {

    private final FcmTokenRepository fcmTokenRepository;
    private final ExpoPushService expoPushService;
    private final FcmPushService fcmPushService;

    @Override
    @Async("pushNotificationExecutor")
    public void sendAsync(UUID userId, String title, String body, Map<String, String> data) {
        List<String> tokens = fcmTokenRepository.findActiveTokensByUserId(userId);
        if (tokens.isEmpty()) {
            log.debug("[Push] Token bulunamadı: userId={}", userId);
            return;
        }

        List<String> expoTokens = tokens.stream().filter(expoPushService::isExpoToken).toList();
        List<String> fcmTokens = tokens.stream().filter(t -> !expoPushService.isExpoToken(t)).toList();

        if (!expoTokens.isEmpty()) {
            expoPushService.sendToTokens(expoTokens, title, body, data);
        }
        if (!fcmTokens.isEmpty()) {
            fcmPushService.sendToTokens(userId, fcmTokens, title, body, data);
        }
    }
}
