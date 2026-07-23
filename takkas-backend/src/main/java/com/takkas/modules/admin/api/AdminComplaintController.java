package com.takkas.modules.admin.api;

import com.takkas.modules.complaint.api.dto.ComplaintModerationResponse;
import com.takkas.modules.complaint.domain.enums.ComplaintTargetType;
import com.takkas.modules.complaint.service.ComplaintModerationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Admin Şikayetler", description = "Şikayet moderasyonu")
@RestController
@RequestMapping("/api/admin/complaints")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminComplaintController {

    private final ComplaintModerationService complaintModerationService;

    @GetMapping("/pending")
    public List<ComplaintModerationResponse> getPending() {
        return complaintModerationService.getPendingComplaints();
    }

    @PatchMapping("/{id}/approve")
    public ComplaintModerationResponse approve(@PathVariable UUID id,
                                               @RequestParam ComplaintTargetType target,
                                               @RequestParam(required = false) String note) {
        return complaintModerationService.approve(target, id, note);
    }

    @PatchMapping("/{id}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@PathVariable UUID id,
                       @RequestParam ComplaintTargetType target,
                       @RequestParam(required = false) String note) {
        complaintModerationService.reject(target, id,
            note != null ? note : "Şikayet incelendi, yayına alınmadı.");
    }
}
