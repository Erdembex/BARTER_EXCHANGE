package com.takkas.modules.coupon.api;

import com.takkas.common.security.*;
import com.takkas.modules.coupon.api.dto.*;
import com.takkas.modules.coupon.domain.enums.CouponStatus;
import com.takkas.modules.coupon.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import java.util.UUID;

@Tag(name = "Kuponlar", description = "Kupon görüntüleme, QR kodu, doğrulama")
@RestController
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;
    private final CouponVerifyService couponVerifyService;

    @GetMapping("/api/individual/coupons")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public List<CouponResponse> getMyCoupons(@CurrentUser UserPrincipal p,
                                              @RequestParam(required = false) CouponStatus status) {
        return couponService.getMyCoupons(p.profileId(), status);
    }

    @GetMapping("/api/individual/coupons/{id}")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public CouponResponse getDetail(@CurrentUser UserPrincipal p, @PathVariable UUID id) {
        return couponService.getDetail(id, p.profileId());
    }

    @GetMapping("/api/individual/coupons/{id}/qr")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public CouponQrResponse getQrCode(@CurrentUser UserPrincipal p, @PathVariable UUID id) {
        return couponService.getQrCode(id, p.profileId());
    }

    @GetMapping("/api/individual/applications/{applicationId}/coupon")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public CouponResponse getByApplication(@CurrentUser UserPrincipal p,
                                           @PathVariable UUID applicationId) {
        return couponService.getByApplicationForOwner(p.profileId(), applicationId);
    }

    @PostMapping("/api/business/coupons/verify/{qrToken}")
    @PreAuthorize("hasRole('BUSINESS')")
    public CouponVerifyResponse verify(@CurrentUser UserPrincipal p, @PathVariable String qrToken) {
        return couponVerifyService.verify(qrToken, p.profileId());
    }

    @GetMapping("/api/business/coupons/issued")
    @PreAuthorize("hasRole('BUSINESS')")
    public List<CouponResponse> getIssuedCoupons(@CurrentUser UserPrincipal p,
                                                   @RequestParam(required = false) CouponStatus status) {
        return couponService.getIssuedCoupons(p.profileId(), status);
    }
}
