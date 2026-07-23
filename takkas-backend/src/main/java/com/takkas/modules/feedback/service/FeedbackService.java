package com.takkas.modules.feedback.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ForbiddenException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.application.domain.Application;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.feedback.api.dto.FeedbackResponse;
import com.takkas.modules.feedback.api.dto.ProfileFeedbackSummary;
import com.takkas.modules.feedback.api.dto.SubmitFeedbackRequest;
import com.takkas.modules.feedback.domain.TaskFeedback;
import com.takkas.modules.feedback.domain.enums.FeedbackAuthorRole;
import com.takkas.modules.feedback.repository.TaskFeedbackRepository;
import com.takkas.modules.user.domain.BusinessProfile;
import com.takkas.modules.user.domain.IndividualProfile;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import com.takkas.modules.user.repository.IndividualProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedbackService {

    private static final EnumSet<ApplicationStatus> FEEDBACK_ELIGIBLE = EnumSet.of(
        ApplicationStatus.SUBMISSION_APPROVED, ApplicationStatus.REWARDED);

    private final TaskFeedbackRepository feedbackRepo;
    private final ApplicationRepository applicationRepo;
    private final BusinessProfileRepository businessRepo;
    private final IndividualProfileRepository individualRepo;

    @Transactional
    public FeedbackResponse submitIndividualFeedback(UUID userId, UUID profileId,
                                                     UUID applicationId, SubmitFeedbackRequest req) {
        Application app = loadEligibleApplication(applicationId);
        if (!app.getIndividual().getId().equals(profileId)) {
            throw new ForbiddenException("Bu başvuruya geri bildirim veremezsin.");
        }
        BusinessProfile business = businessRepo.findById(app.getBusinessId())
            .orElseThrow(() -> new ResourceNotFoundException("İşletme bulunamadı."));
        return saveFeedback(userId, app.getId(), FeedbackAuthorRole.INDIVIDUAL,
            business.getId(), req);
    }

    @Transactional
    public FeedbackResponse submitBusinessFeedback(UUID userId, UUID profileId,
                                                   UUID applicationId, SubmitFeedbackRequest req) {
        Application app = loadEligibleApplication(applicationId);
        if (!app.getBusinessId().equals(profileId)) {
            throw new ForbiddenException("Bu başvuruya geri bildirim veremezsin.");
        }
        return saveFeedback(userId, app.getId(), FeedbackAuthorRole.BUSINESS,
            app.getIndividual().getId(), req);
    }

    public ProfileFeedbackSummary getProfileFeedback(UUID profileId, int recentLimit) {
        Double avg = feedbackRepo.averageStarsByTargetProfileId(profileId);
        long count = feedbackRepo.countByTargetProfileId(profileId);
        List<FeedbackResponse> recent = feedbackRepo
            .findAllByTargetProfileIdOrderByCreatedAtDesc(profileId).stream()
            .limit(recentLimit)
            .map(this::toResponse)
            .toList();
        return new ProfileFeedbackSummary(avg != null ? avg : 0.0, count, recent);
    }

    public boolean hasFeedbackForApplication(UUID applicationId, UUID authorUserId) {
        return feedbackRepo.findByApplicationIdAndAuthorUserId(applicationId, authorUserId).isPresent();
    }

    private FeedbackResponse saveFeedback(UUID authorUserId, UUID applicationId,
                                          FeedbackAuthorRole role, UUID targetProfileId,
                                          SubmitFeedbackRequest req) {
        if (feedbackRepo.findByApplicationIdAndAuthorUserId(applicationId, authorUserId).isPresent()) {
            throw new BusinessRuleException("Bu görev için zaten geri bildirim verdin.");
        }
        if (req.comment() != null && !req.comment().isBlank() && req.stars() < 1) {
            throw new BusinessRuleException("Önce yıldız vermelisin.");
        }

        TaskFeedback feedback = TaskFeedback.builder()
            .applicationId(applicationId)
            .authorUserId(authorUserId)
            .authorRole(role)
            .targetProfileId(targetProfileId)
            .stars(req.stars())
            .comment(req.comment() != null ? req.comment().trim() : null)
            .build();

        return toResponse(feedbackRepo.save(feedback));
    }

    private Application loadEligibleApplication(UUID applicationId) {
        Application app = applicationRepo.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Başvuru bulunamadı."));
        if (!FEEDBACK_ELIGIBLE.contains(app.getStatus())) {
            throw new BusinessRuleException("Geri bildirim yalnızca tamamlanan görevler için verilebilir.");
        }
        return app;
    }

    private FeedbackResponse toResponse(TaskFeedback f) {
        return new FeedbackResponse(
            f.getId(),
            f.getApplicationId(),
            f.getTargetProfileId(),
            f.getAuthorRole(),
            f.getStars(),
            f.getComment(),
            resolveAuthorName(f),
            f.getCreatedAt());
    }

    private String resolveAuthorName(TaskFeedback f) {
        if (f.getAuthorRole() == FeedbackAuthorRole.BUSINESS) {
            return businessRepo.findByUserId(f.getAuthorUserId())
                .map(BusinessProfile::getBusinessName)
                .orElse("İşletme");
        }
        return individualRepo.findByUserId(f.getAuthorUserId())
            .map(IndividualProfile::getFullName)
            .orElse("Kullanıcı");
    }
}
