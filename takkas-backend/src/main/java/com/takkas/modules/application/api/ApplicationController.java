package com.takkas.modules.application.api;

import com.takkas.common.security.*;
import com.takkas.modules.application.api.dto.*;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.application.service.*;
import com.takkas.modules.coupon.api.dto.CouponResponse;
import com.takkas.modules.user.domain.enums.UserType;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Başvurular", description = "Başvuru akışı — gönder, kabul et, reddet")
@RestController
@RequiredArgsConstructor
public class ApplicationController {

    private final ApplicationService applicationService;
    private final ApplicationQueryService queryService;
    private final ApplicationCouponService applicationCouponService;

    @PostMapping("/api/individual/applications")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public ApplicationResponse apply(@CurrentUser UserPrincipal p,
                                      @Valid @RequestBody ApplyRequest req) {
        return applicationService.apply(p.profileId(), p.userId(), req);
    }

    @DeleteMapping("/api/individual/applications/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public void withdraw(@CurrentUser UserPrincipal p, @PathVariable UUID id) {
        applicationService.withdraw(p.profileId(), id);
    }

    @GetMapping("/api/individual/applications")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public List<ApplicationResponse> getMyApplications(@CurrentUser UserPrincipal p) {
        return queryService.getMyApplications(p.profileId());
    }

    @GetMapping("/api/individual/applications/{id}")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public ApplicationDetailResponse getMyDetail(@CurrentUser UserPrincipal p,
                                                   @PathVariable UUID id) {
        return queryService.getDetail(id, p.profileId(), UserType.INDIVIDUAL);
    }

    @GetMapping("/api/business/listings/{listingId}/applications")
    @PreAuthorize("hasRole('BUSINESS')")
    public List<ApplicantResponse> getApplicants(@CurrentUser UserPrincipal p,
                                                   @PathVariable UUID listingId,
                                                   @RequestParam(required = false) ApplicationStatus status) {
        return queryService.getApplicantsByListing(p.profileId(), listingId, status);
    }

    @GetMapping("/api/business/applications/{id}")
    @PreAuthorize("hasRole('BUSINESS')")
    public ApplicationDetailResponse getApplicantDetail(@CurrentUser UserPrincipal p,
                                                          @PathVariable UUID id) {
        return queryService.getDetail(id, p.profileId(), UserType.BUSINESS);
    }

    @PatchMapping("/api/business/applications/{id}/review")
    @PreAuthorize("hasRole('BUSINESS')")
    public ApplicationResponse review(@CurrentUser UserPrincipal p, @PathVariable UUID id) {
        return applicationService.markUnderReview(p.profileId(), id);
    }

    @PatchMapping("/api/business/applications/{id}/accept")
    @PreAuthorize("hasRole('BUSINESS')")
    public ApplicationResponse accept(@CurrentUser UserPrincipal p, @PathVariable UUID id) {
        return applicationService.accept(p.profileId(), id);
    }

    @PatchMapping("/api/business/applications/{id}/reject")
    @PreAuthorize("hasRole('BUSINESS')")
    public ApplicationResponse reject(@CurrentUser UserPrincipal p, @PathVariable UUID id) {
        return applicationService.reject(p.profileId(), id);
    }

    @PostMapping("/api/individual/applications/{id}/submission")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public ApplicationResponse submit(@CurrentUser UserPrincipal p,
                                      @PathVariable UUID id,
                                      @Valid @RequestBody SubmitSubmissionRequest req) {
        return applicationService.submitSubmission(p.profileId(), id, req);
    }

    @PostMapping("/api/business/applications/{id}/issue-coupon")
    @PreAuthorize("hasRole('BUSINESS')")
    public CouponResponse issueCoupon(@CurrentUser UserPrincipal p,
                                      @PathVariable UUID id,
                                      @RequestParam(required = false) String note) {
        return applicationCouponService.issueCoupon(p.profileId(), id, note);
    }
}
