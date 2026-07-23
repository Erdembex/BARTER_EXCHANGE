package com.takkas.modules.complaint.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ForbiddenException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.application.domain.Application;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.complaint.api.dto.ComplaintEligibleApplicationResponse;
import com.takkas.modules.complaint.domain.enums.ComplaintStatus;
import com.takkas.modules.complaint.repository.BusinessComplaintRepository;
import com.takkas.modules.complaint.repository.IndividualComplaintRepository;
import com.takkas.modules.listing.repository.ListingRepository;
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
public class ComplaintEligibilityService {

    /** İşletme onayından sonraki tüm durumlar — kupon şart değil */
    static final EnumSet<ApplicationStatus> COMPLAINT_ELIGIBLE = EnumSet.of(
        ApplicationStatus.ACCEPTED,
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.SUBMISSION_APPROVED,
        ApplicationStatus.REWARDED);

    private final ApplicationRepository applicationRepository;
    private final ListingRepository listingRepository;
    private final BusinessProfileRepository businessRepository;
    private final IndividualProfileRepository individualRepository;
    private final BusinessComplaintRepository businessComplaintRepository;
    private final IndividualComplaintRepository individualComplaintRepository;

    public List<ComplaintEligibleApplicationResponse> getEligibleForIndividual(
        UUID individualProfileId, UUID reporterUserId, UUID businessProfileIdFilter) {
        return applicationRepository
            .findAllByIndividualIdAndStatusInOrderByReviewedAtDesc(individualProfileId, COMPLAINT_ELIGIBLE)
            .stream()
            .filter(app -> businessProfileIdFilter == null
                || app.getBusinessId().equals(businessProfileIdFilter))
            .filter(app -> !hasBlockingBusinessComplaint(reporterUserId, app.getId()))
            .map(this::toEligibleResponse)
            .toList();
    }

    public List<ComplaintEligibleApplicationResponse> getEligibleForBusiness(
        UUID businessProfileId, UUID reporterUserId) {
        return applicationRepository
            .findAllByBusinessIdAndStatusInOrderByAppliedAtDesc(businessProfileId, COMPLAINT_ELIGIBLE)
            .stream()
            .filter(app -> !hasBlockingIndividualComplaint(reporterUserId, app.getId()))
            .map(this::toEligibleResponse)
            .toList();
    }

    public Application validateForIndividualComplaint(UUID individualProfileId, UUID reporterUserId,
                                                    UUID applicationId) {
        Application app = loadApplication(applicationId);
        if (!app.getIndividual().getId().equals(individualProfileId)) {
            throw new ForbiddenException("Bu başvuru için şikayet oluşturamazsın.");
        }
        if (!COMPLAINT_ELIGIBLE.contains(app.getStatus())) {
            throw new BusinessRuleException(
                "Şikayet için işletmenin onayladığı bir görevin olmalı.");
        }
        if (hasBlockingBusinessComplaint(reporterUserId, applicationId)) {
            throw new BusinessRuleException("Bu görev için zaten şikayetin var.");
        }
        return app;
    }

    public Application validateForBusinessComplaint(UUID businessProfileId, UUID reporterUserId,
                                                  UUID applicationId) {
        Application app = loadApplication(applicationId);
        if (!app.getBusinessId().equals(businessProfileId)) {
            throw new ForbiddenException("Bu başvuru için şikayet oluşturamazsın.");
        }
        if (!COMPLAINT_ELIGIBLE.contains(app.getStatus())) {
            throw new BusinessRuleException(
                "Şikayet için onayladığın bir başvuru olmalı.");
        }
        if (hasBlockingIndividualComplaint(reporterUserId, applicationId)) {
            throw new BusinessRuleException("Bu görev için zaten şikayetin var.");
        }
        return app;
    }

    private Application loadApplication(UUID applicationId) {
        return applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Başvuru bulunamadı."));
    }

    private boolean hasBlockingBusinessComplaint(UUID reporterUserId, UUID applicationId) {
        return businessComplaintRepository.existsByReporterUserIdAndApplicationIdAndStatus(
            reporterUserId, applicationId, ComplaintStatus.PENDING)
            || businessComplaintRepository.existsByApplicationIdAndStatus(
            applicationId, ComplaintStatus.APPROVED);
    }

    private boolean hasBlockingIndividualComplaint(UUID reporterUserId, UUID applicationId) {
        return individualComplaintRepository.existsByReporterUserIdAndApplicationIdAndStatus(
            reporterUserId, applicationId, ComplaintStatus.PENDING)
            || individualComplaintRepository.existsByApplicationIdAndStatus(
            applicationId, ComplaintStatus.APPROVED);
    }

    private ComplaintEligibleApplicationResponse toEligibleResponse(Application app) {
        String listingTitle = listingRepository.findById(app.getListingId())
            .map(l -> l.getTitle())
            .orElse("Görev");
        BusinessProfile business = businessRepository.findById(app.getBusinessId()).orElse(null);
        IndividualProfile individual = app.getIndividual();
        String businessName = business != null ? business.getBusinessName() : "İşletme";
        String individualName = displayIndividual(individual);
        return new ComplaintEligibleApplicationResponse(
            app.getId(),
            app.getListingId(),
            listingTitle,
            app.getBusinessId(),
            businessName,
            individual.getId(),
            individualName,
            app.getStatus(),
            app.getAppliedAt());
    }

    private String displayIndividual(IndividualProfile profile) {
        if (profile.getUsername() != null && !profile.getUsername().isBlank()) {
            return "@" + profile.getUsername();
        }
        return profile.getFullName() != null ? profile.getFullName() : "Kullanıcı";
    }
}
