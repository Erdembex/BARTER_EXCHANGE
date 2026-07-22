package com.takkas.modules.user.service;

import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.application.domain.Application;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.listing.repository.ListingRepository;
import com.takkas.modules.user.api.dto.*;
import com.takkas.modules.user.domain.*;
import com.takkas.modules.user.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private static final EnumSet<ApplicationStatus> PORTFOLIO_STATUSES = EnumSet.of(
        ApplicationStatus.SUBMISSION_APPROVED, ApplicationStatus.REWARDED);

    private final BusinessProfileRepository businessRepo;
    private final IndividualProfileRepository individualRepo;
    private final ApplicationRepository applicationRepository;
    private final ListingRepository listingRepository;

    public BusinessProfileResponse getBusinessProfile(UUID profileId) {
        BusinessProfile p = businessRepo.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("İşletme profili bulunamadı."));
        return toResponse(p);
    }

    public IndividualProfileResponse getIndividualProfile(UUID profileId) {
        IndividualProfile p = individualRepo.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("Bireysel profil bulunamadı."));
        return toResponse(p);
    }

    public IndividualPublicProfileResponse getPublicIndividualProfile(UUID profileId) {
        IndividualProfile profile = individualRepo.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("Profil bulunamadı."));
        return buildPublicProfile(profile);
    }

    public IndividualPublicProfileResponse getPublicIndividualProfileByUserId(UUID userId) {
        IndividualProfile profile = individualRepo.findByUserId(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Profil bulunamadı."));
        return buildPublicProfile(profile);
    }

    private IndividualPublicProfileResponse buildPublicProfile(IndividualProfile profile) {
        var applications = applicationRepository
            .findAllByIndividualIdAndStatusInOrderByReviewedAtDesc(
                profile.getId(), PORTFOLIO_STATUSES);

        var listingTitles = new HashMap<UUID, String>();
        for (Application app : applications) {
            listingTitles.computeIfAbsent(app.getListingId(), listingId ->
                listingRepository.findById(listingId)
                    .map(listing -> listing.getTitle())
                    .orElse("Görev"));
        }

        List<PortfolioItemResponse> portfolioItems = new ArrayList<>();
        for (Application app : applications) {
            String title = listingTitles.getOrDefault(app.getListingId(), "Görev");
            Instant approvedAt = app.getReviewedAt() != null
                ? app.getReviewedAt()
                : (app.getSubmittedAt() != null ? app.getSubmittedAt() : app.getAppliedAt());
            var images = app.getSubmissionImageUrls();
            for (int i = 0; i < images.size(); i++) {
                portfolioItems.add(new PortfolioItemResponse(
                    app.getId(), title, images.get(i), approvedAt));
            }
        }

        portfolioItems.sort(Comparator.comparing(
            PortfolioItemResponse::approvedAt,
            Comparator.nullsLast(Comparator.reverseOrder())));

        return new IndividualPublicProfileResponse(
            profile.getId(),
            profile.getFullName(),
            profile.getAvatarUrl(),
            applications.size(),
            portfolioItems);
    }

    @Transactional
    public BusinessProfileResponse updateBusinessProfile(UUID profileId, UpdateBusinessProfileRequest req) {
        BusinessProfile p = businessRepo.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("İşletme profili bulunamadı."));
        p.setBusinessName(req.businessName());
        p.setCategory(req.category());
        p.setCity(req.city());
        p.setDistrict(req.district());
        p.setPhone(req.phone());
        p.setLogoUrl(req.logoUrl());
        p.setBio(req.bio());
        return toResponse(p);
    }

    @Transactional
    public IndividualProfileResponse updateIndividualProfile(UUID profileId, UpdateIndividualProfileRequest req) {
        IndividualProfile p = individualRepo.findById(profileId)
            .orElseThrow(() -> new ResourceNotFoundException("Bireysel profil bulunamadı."));
        p.setFullName(req.fullName());
        p.setCity(req.city());
        p.setDistrict(req.district());
        p.setAvatarUrl(req.avatarUrl());
        p.setBio(req.bio());
        p.getSkills().clear();
        req.skills().forEach(skill -> p.getSkills().add(new IndividualSkill(p, skill)));
        return toResponse(p);
    }

    private BusinessProfileResponse toResponse(BusinessProfile p) {
        return new BusinessProfileResponse(p.getId(), p.getBusinessName(), p.getCategory(),
            p.getCity(), p.getDistrict(), p.getPhone(), p.getLogoUrl(), p.getBio(), p.isVerified());
    }

    private IndividualProfileResponse toResponse(IndividualProfile p) {
        return new IndividualProfileResponse(p.getId(), p.getFullName(), p.getCity(),
            p.getDistrict(), p.getAvatarUrl(), p.getBio(),
            p.getSkills().stream().map(IndividualSkill::getSkill).toList());
    }
}
