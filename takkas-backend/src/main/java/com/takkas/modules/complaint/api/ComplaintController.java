package com.takkas.modules.complaint.api;

import com.takkas.common.security.CurrentUser;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.complaint.api.dto.ComplaintEligibleApplicationResponse;
import com.takkas.modules.complaint.api.dto.ComplaintResponse;
import com.takkas.modules.complaint.api.dto.CreateComplaintRequest;
import com.takkas.modules.complaint.api.dto.PublicComplaintResponse;
import com.takkas.modules.complaint.service.ComplaintEligibilityService;
import com.takkas.modules.complaint.service.ComplaintService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Şikayetler", description = "İşletme şikayetleri")
@RestController
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;
    private final ComplaintEligibilityService eligibilityService;

    @PostMapping("/api/individual/complaints")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public ComplaintResponse create(@CurrentUser UserPrincipal principal,
                                    @Valid @RequestBody CreateComplaintRequest req) {
        return complaintService.create(principal.userId(), principal.profileId(), req);
    }

    @GetMapping("/api/individual/complaints/eligible-applications")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public List<ComplaintEligibleApplicationResponse> getEligibleApplications(
        @CurrentUser UserPrincipal principal,
        @RequestParam(required = false) UUID businessProfileId) {
        return eligibilityService.getEligibleForIndividual(
            principal.profileId(), principal.userId(), businessProfileId);
    }

    @GetMapping("/api/individual/complaints/mine")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public List<ComplaintResponse> getMine(@CurrentUser UserPrincipal principal) {
        return complaintService.getMyComplaints(principal.userId());
    }

    /** Onaylanmış şikayetler — Şikayet BEX akışı */
    @GetMapping("/api/complaints/public")
    @PreAuthorize("isAuthenticated()")
    public List<PublicComplaintResponse> getPublicApproved() {
        return complaintService.getApprovedPublicComplaints();
    }
}
