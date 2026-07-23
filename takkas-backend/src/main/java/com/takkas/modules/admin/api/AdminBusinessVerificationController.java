package com.takkas.modules.admin.api;

import com.takkas.modules.user.api.dto.BusinessProfileResponse;
import com.takkas.modules.user.api.dto.PendingBusinessVerificationResponse;
import com.takkas.modules.user.service.BusinessVerificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Admin KYC", description = "İşletme doğrulama moderasyonu")
@RestController
@RequestMapping("/api/admin/business-verifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminBusinessVerificationController {

    private final BusinessVerificationService verificationService;

    @GetMapping("/pending")
    public List<PendingBusinessVerificationResponse> getPending() {
        return verificationService.getPendingVerifications();
    }

    @PatchMapping("/{profileId}/approve")
    public BusinessProfileResponse approve(@PathVariable UUID profileId) {
        return verificationService.approve(profileId);
    }

    @PatchMapping("/{profileId}/reject")
    public BusinessProfileResponse reject(@PathVariable UUID profileId) {
        return verificationService.reject(profileId);
    }
}
