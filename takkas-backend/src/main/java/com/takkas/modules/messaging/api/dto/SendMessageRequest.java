package com.takkas.modules.messaging.api.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Size;

public record SendMessageRequest(
    @Size(max = 1000) String content,
    @Size(max = 2048) String mediaUrl) {

    @AssertTrue(message = "Mesaj metni veya görsel gerekli.")
    public boolean isPayloadPresent() {
        boolean hasContent = content != null && !content.isBlank();
        boolean hasMedia = mediaUrl != null && !mediaUrl.isBlank();
        return hasContent || hasMedia;
    }
}