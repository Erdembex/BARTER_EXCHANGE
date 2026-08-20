package com.takkas.modules.feedback.api;

import com.takkas.common.security.CurrentUser;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.feedback.api.dto.FeedbackResponse;
import com.takkas.modules.feedback.api.dto.PendingFeedbackResponse;
import com.takkas.modules.feedback.api.dto.ProfileFeedbackSummary;
import com.takkas.modules.feedback.api.dto.SubmitFeedbackRequest;
import com.takkas.modules.feedback.service.FeedbackService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Geri Bildirim", description = "Görev sonrası yıldız ve yorum")
@RestController
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping("/api/individual/applications/{id}/feedback")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public FeedbackResponse submitIndividual(@CurrentUser UserPrincipal p,
                                             @PathVariable UUID id,
                                             @Valid @RequestBody SubmitFeedbackRequest req) {
        return feedbackService.submitIndividualFeedback(p.userId(), p.profileId(), id, req);
    }

    @PostMapping("/api/business/applications/{id}/feedback")
    @PreAuthorize("hasRole('BUSINESS')")
    public FeedbackResponse submitBusiness(@CurrentUser UserPrincipal p,
                                           @PathVariable UUID id,
                                           @Valid @RequestBody SubmitFeedbackRequest req) {
        return feedbackService.submitBusinessFeedback(p.userId(), p.profileId(), id, req);
    }

    @GetMapping("/api/profiles/{profileId}/feedback")
    @PreAuthorize("isAuthenticated()")
    public ProfileFeedbackSummary getProfileFeedback(@PathVariable UUID profileId,
                                                     @RequestParam(defaultValue = "10") int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 20);
        return feedbackService.getProfileFeedback(profileId, safeLimit);
    }

    @GetMapping("/api/individual/applications/pending-feedback")
    @PreAuthorize("hasRole('INDIVIDUAL')")
    public List<PendingFeedbackResponse> getIndividualPendingFeedback(@CurrentUser UserPrincipal p) {
        return feedbackService.getPendingFeedbackForIndividual(p.profileId(), p.userId());
    }

    @GetMapping("/api/business/applications/pending-feedback")
    @PreAuthorize("hasRole('BUSINESS')")
    public List<PendingFeedbackResponse> getBusinessPendingFeedback(@CurrentUser UserPrincipal p) {
        return feedbackService.getPendingFeedbackForBusiness(p.profileId(), p.userId());
    }
}
