package com.takkas.infrastructure.push;

import java.util.Map;
import java.util.UUID;

public interface PushNotificationService {
    void sendAsync(UUID userId, String title, String body, Map<String, String> data);
}
