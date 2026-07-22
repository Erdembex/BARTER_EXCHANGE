package com.takkas.modules.application.service;

import com.takkas.common.exception.*;
import com.takkas.modules.application.api.dto.*;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.application.mapper.ApplicationMapper;
import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.listing.repository.ListingRepository;
import com.takkas.modules.user.UserFacade;
import com.takkas.modules.user.domain.enums.UserType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ApplicationQueryService {

    private final ApplicationRepository applicationRepository;
    private final ListingRepository listingRepository;
    private final UserFacade userFacade;

    public List<ApplicantResponse> getApplicantsByListing(UUID businessId,
                                                            UUID listingId,
                                                            ApplicationStatus statusFilter) {
        if (!listingRepository.existsByIdAndBusinessId(listingId, businessId))
            throw new ForbiddenException("Bu ilana erişim yetkiniz yok.");
        var apps = statusFilter != null
            ? applicationRepository.findAllByListingIdAndStatus(listingId, statusFilter)
            : applicationRepository.findAllByListingIdOrderByAppliedAtDesc(listingId);
        return apps.stream().map(a -> {
            var profile = userFacade.getIndividualSummary(a.getIndividual().getId());
            return ApplicationMapper.toApplicantResponse(a, profile);
        }).toList();
    }

    public List<ApplicationResponse> getMyApplications(UUID individualId) {
        return applicationRepository.findAllByIndividualIdOrderByAppliedAtDesc(individualId)
            .stream().map(ApplicationMapper::toResponse).toList();
    }

    public ApplicationDetailResponse getDetail(UUID applicationId, UUID requesterId, UserType type) {
        var app = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Başvuru bulunamadı."));
        boolean ok = switch (type) {
            case BUSINESS   -> app.getBusinessId().equals(requesterId);
            case INDIVIDUAL -> app.getIndividual().getId().equals(requesterId);
            case ADMIN      -> true;
        };
        if (!ok) throw new ForbiddenException("Bu başvuruya erişim yetkiniz yok.");
        var profile = userFacade.getIndividualSummary(app.getIndividual().getId());
        return ApplicationMapper.toDetailResponse(app, profile);
    }

    public List<ApplicationDetailResponse> getPendingSubmissions() {
        return applicationRepository.findAllByStatusOrderBySubmittedAtDesc(ApplicationStatus.SUBMITTED)
            .stream()
            .map(a -> ApplicationMapper.toDetailResponse(
                a, userFacade.getIndividualSummary(a.getIndividual().getId())))
            .toList();
    }

    public ApplicationDetailResponse getAdminDetail(UUID applicationId) {
        var app = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Başvuru bulunamadı."));
        var profile = userFacade.getIndividualSummary(app.getIndividual().getId());
        return ApplicationMapper.toDetailResponse(app, profile);
    }
}
