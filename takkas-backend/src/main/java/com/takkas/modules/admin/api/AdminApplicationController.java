package com.takkas.modules.admin.api;

import com.takkas.modules.application.api.dto.ApplicationDetailResponse;
import com.takkas.modules.application.service.ApplicationQueryService;
import com.takkas.modules.application.service.ApplicationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Admin Başvurular", description = "Teslim moderasyonu")
@RestController
@RequestMapping("/api/admin/applications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminApplicationController {

    private final ApplicationQueryService queryService;
    private final ApplicationService applicationService;

    @GetMapping("/submissions/pending")
    public List<ApplicationDetailResponse> getPendingSubmissions() {
        return queryService.getPendingSubmissions();
    }

    @PatchMapping("/{id}/approve-submission")
    public ApplicationDetailResponse approveSubmission(@PathVariable UUID id,
                                                        @RequestParam(required = false) String note) {
        applicationService.approveSubmission(id, note);
        return queryService.getAdminDetail(id);
    }

    @PatchMapping("/{id}/reject-submission")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rejectSubmission(@PathVariable UUID id,
                                  @RequestParam(required = false) String note) {
        applicationService.rejectSubmission(id, note);
    }
}
