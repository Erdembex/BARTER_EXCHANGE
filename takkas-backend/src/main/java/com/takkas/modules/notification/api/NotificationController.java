package com.takkas.modules.notification.api;

import com.takkas.common.pagination.PageResponse;
import com.takkas.common.security.*;
import com.takkas.infrastructure.push.*;
import com.takkas.modules.notification.api.dto.*;
import com.takkas.modules.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Tag(name = "Bildirimler", description = "Uygulama içi bildirimler ve FCM token yönetimi")
@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final FcmTokenRepository fcmTokenRepository;

    @GetMapping("/api/notifications")
    public ResponseEntity<PageResponse<NotificationResponse>> getNotifications(
            @CurrentUser UserPrincipal p,
            @RequestParam(required = false) Instant cursor,
            @RequestParam(defaultValue = "20") int pageSize) {
        Instant effectiveCursor = (cursor != null) ? cursor : Instant.MAX;
        var page = notificationService.getNotifications(p.userId(), effectiveCursor, pageSize);
        int unread = notificationService.getUnreadCount(p.userId());
        return ResponseEntity.ok()
            .header("X-Unread-Count", String.valueOf(unread))
            .body(page);
    }

    @GetMapping("/api/notifications/unread-count")
    public UnreadCountResponse getUnreadCount(@CurrentUser UserPrincipal p) {
        return new UnreadCountResponse(notificationService.getUnreadCount(p.userId()));
    }

    @PatchMapping("/api/notifications/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(@CurrentUser UserPrincipal p) {
        notificationService.markAllRead(p.userId());
    }

    @PatchMapping("/api/notifications/read-by-reference/{referenceId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markReadByReference(@CurrentUser UserPrincipal p, @PathVariable UUID referenceId) {
        notificationService.markReadByReference(p.userId(), referenceId);
    }

    @PatchMapping("/api/notifications/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markReadById(@CurrentUser UserPrincipal p, @PathVariable UUID id) {
        notificationService.markReadById(p.userId(), id);
    }

    // ── FCM Token ─────────────────────────────────────────

    @PostMapping("/api/device/fcm-token")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void registerFcmToken(@CurrentUser UserPrincipal p,
                                  @Valid @RequestBody FcmTokenRequest req) {
        fcmTokenRepository.findByUserIdAndToken(p.userId(), req.token())
            .ifPresentOrElse(
                existing -> existing.setActive(true),
                () -> fcmTokenRepository.save(FcmToken.builder()
                    .userId(p.userId()).token(req.token())
                    .platform(FcmPlatform.valueOf(req.platform()))
                    .build())
            );
    }

    @DeleteMapping("/api/device/fcm-token")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFcmToken(@CurrentUser UserPrincipal p,
                                @RequestBody FcmTokenRequest req) {
        fcmTokenRepository.findByUserIdAndToken(p.userId(), req.token())
            .ifPresent(t -> t.setActive(false));
    }
}
