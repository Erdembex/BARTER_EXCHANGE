package com.takkas.modules.complaint.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.application.domain.Application;
import com.takkas.modules.complaint.api.dto.CreateIndividualComplaintRequest;
import com.takkas.modules.complaint.api.dto.IndividualComplaintResponse;
import com.takkas.modules.complaint.domain.IndividualComplaint;
import com.takkas.modules.complaint.domain.enums.ComplaintStatus;
import com.takkas.modules.complaint.repository.IndividualComplaintRepository;
import com.takkas.modules.user.domain.IndividualProfile;
import com.takkas.modules.user.repository.IndividualProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IndividualComplaintService {

    private final IndividualComplaintRepository complaintRepo;
    private final IndividualProfileRepository individualRepo;
    private final ComplaintEligibilityService eligibilityService;

    @Transactional
    public IndividualComplaintResponse create(UUID reporterUserId, UUID businessProfileId,
                                            CreateIndividualComplaintRequest req) {
        Application app = eligibilityService.validateForBusinessComplaint(
            businessProfileId, reporterUserId, req.applicationId());
        IndividualProfile individual = individualRepo.findById(app.getIndividual().getId())
            .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı profili bulunamadı."));

        IndividualComplaint complaint = IndividualComplaint.builder()
            .reporterUserId(reporterUserId)
            .individualProfileId(individual.getId())
            .applicationId(app.getId())
            .reason(req.reason())
            .description(req.description().trim())
            .status(ComplaintStatus.PENDING)
            .build();

        return toResponse(complaintRepo.save(complaint), displayName(individual));
    }

    public List<IndividualComplaintResponse> getMyComplaints(UUID reporterUserId) {
        return complaintRepo.findAllByReporterUserIdOrderByCreatedAtDesc(reporterUserId).stream()
            .map(c -> toResponse(c, resolveDisplayName(c.getIndividualProfileId())))
            .toList();
    }

    public List<IndividualComplaintResponse> getPendingComplaints() {
        return complaintRepo.findAllByStatusOrderByCreatedAtDesc(ComplaintStatus.PENDING).stream()
            .map(c -> toResponse(c, resolveDisplayName(c.getIndividualProfileId())))
            .toList();
    }

    @Transactional
    public IndividualComplaintResponse approve(UUID complaintId, String adminNote) {
        IndividualComplaint complaint = complaintRepo.findById(complaintId)
            .orElseThrow(() -> new ResourceNotFoundException("Şikayet bulunamadı."));
        if (complaint.getStatus() != ComplaintStatus.PENDING) {
            throw new BusinessRuleException("Bu şikayet zaten incelenmiş.");
        }
        complaint.approve(adminNote);
        return toResponse(complaint, resolveDisplayName(complaint.getIndividualProfileId()));
    }

    @Transactional
    public void reject(UUID complaintId, String adminNote) {
        IndividualComplaint complaint = complaintRepo.findById(complaintId)
            .orElseThrow(() -> new ResourceNotFoundException("Şikayet bulunamadı."));
        if (complaint.getStatus() != ComplaintStatus.PENDING) {
            throw new BusinessRuleException("Bu şikayet zaten incelenmiş.");
        }
        complaint.reject(adminNote);
    }

    private IndividualComplaintResponse toResponse(IndividualComplaint c, String displayName) {
        return new IndividualComplaintResponse(
            c.getId(),
            c.getIndividualProfileId(),
            displayName,
            c.getReason(),
            c.getDescription(),
            c.getStatus(),
            c.getAdminNote(),
            c.getCreatedAt(),
            c.getReviewedAt());
    }

    private String resolveDisplayName(UUID individualProfileId) {
        return individualRepo.findById(individualProfileId)
            .map(this::displayName)
            .orElse("Kullanıcı");
    }

    private String displayName(IndividualProfile profile) {
        if (profile.getUsername() != null && !profile.getUsername().isBlank()) {
            return "@" + profile.getUsername();
        }
        return profile.getFullName() != null ? profile.getFullName() : "Kullanıcı";
    }
}
