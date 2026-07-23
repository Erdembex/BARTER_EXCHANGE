package com.takkas.modules.complaint.api;

import com.takkas.common.security.CurrentUser;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.complaint.api.dto.ComplaintEligibleApplicationResponse;
import com.takkas.modules.complaint.api.dto.CreateIndividualComplaintRequest;
import com.takkas.modules.complaint.api.dto.IndividualComplaintResponse;
import com.takkas.modules.complaint.service.ComplaintEligibilityService;
import com.takkas.modules.complaint.service.IndividualComplaintService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "İşletme Şikayetleri", description = "Kullanıcı şikayetleri")
@RestController
@RequiredArgsConstructor
public class BusinessComplaintController {

    private final IndividualComplaintService individualComplaintService;
    private final ComplaintEligibilityService eligibilityService;

    @PostMapping("/api/business/complaints")
    @PreAuthorize("hasRole('BUSINESS')")
    public IndividualComplaintResponse create(@CurrentUser UserPrincipal principal,
                                              @Valid @RequestBody CreateIndividualComplaintRequest req) {
        return individualComplaintService.create(
            principal.userId(), principal.profileId(), req);
    }

    @GetMapping("/api/business/complaints/eligible-applications")
    @PreAuthorize("hasRole('BUSINESS')")
    public List<ComplaintEligibleApplicationResponse> getEligibleApplications(
        @CurrentUser UserPrincipal principal) {
        return eligibilityService.getEligibleForBusiness(principal.profileId(), principal.userId());
    }

    @GetMapping("/api/business/complaints/mine")
    @PreAuthorize("hasRole('BUSINESS')")
    public List<IndividualComplaintResponse> getMine(@CurrentUser UserPrincipal principal) {
        return individualComplaintService.getMyComplaints(principal.userId());
    }
}
