package com.takkas.modules.user.service;

import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.user.api.dto.*;
import com.takkas.modules.user.domain.*;
import com.takkas.modules.user.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final BusinessProfileRepository businessRepo;
    private final IndividualProfileRepository individualRepo;

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
