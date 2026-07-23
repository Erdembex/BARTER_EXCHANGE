package com.takkas.modules.complaint.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.application.domain.Application;
import com.takkas.modules.complaint.api.dto.ComplaintResponse;
import com.takkas.modules.complaint.api.dto.CreateComplaintRequest;
import com.takkas.modules.complaint.api.dto.PublicComplaintResponse;
import com.takkas.modules.complaint.domain.BusinessComplaint;
import com.takkas.modules.complaint.domain.enums.ComplaintStatus;
import com.takkas.modules.complaint.repository.BusinessComplaintRepository;
import com.takkas.modules.user.domain.BusinessProfile;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ComplaintService {

    private final BusinessComplaintRepository complaintRepo;
    private final BusinessProfileRepository businessRepo;
    private final ComplaintEligibilityService eligibilityService;

    @Transactional
    public ComplaintResponse create(UUID reporterUserId, UUID individualProfileId,
                                    CreateComplaintRequest req) {
        Application app = eligibilityService.validateForIndividualComplaint(
            individualProfileId, reporterUserId, req.applicationId());
        BusinessProfile business = businessRepo.findById(app.getBusinessId())
            .orElseThrow(() -> new ResourceNotFoundException("İşletme bulunamadı."));

        BusinessComplaint complaint = BusinessComplaint.builder()
            .reporterUserId(reporterUserId)
            .businessProfileId(business.getId())
            .applicationId(app.getId())
            .reason(req.reason())
            .description(req.description().trim())
            .status(ComplaintStatus.PENDING)
            .build();

        return toResponse(complaintRepo.save(complaint), business.getBusinessName());
    }

    public List<ComplaintResponse> getMyComplaints(UUID reporterUserId) {
        return complaintRepo.findAllByReporterUserIdOrderByCreatedAtDesc(reporterUserId).stream()
            .map(c -> toResponse(c, resolveBusinessName(c.getBusinessProfileId())))
            .toList();
    }

    public List<PublicComplaintResponse> getApprovedPublicComplaints() {
        List<BusinessComplaint> complaints = complaintRepo.findAllByStatusOrderByCreatedAtDesc(
            ComplaintStatus.APPROVED);
        Map<UUID, BusinessProfile> businesses = loadBusinesses(complaints);
        return complaints.stream()
            .map(c -> {
                BusinessProfile b = businesses.get(c.getBusinessProfileId());
                return new PublicComplaintResponse(
                    c.getId(),
                    c.getBusinessProfileId(),
                    b != null ? b.getBusinessName() : "İşletme",
                    b != null ? b.getCategory().name() : "OTHER",
                    c.getReason(),
                    c.getDescription(),
                    c.getReviewedAt() != null ? c.getReviewedAt() : c.getCreatedAt());
            })
            .toList();
    }

    public boolean isBusinessListedInComplaintBex(UUID businessProfileId) {
        return complaintRepo.existsByBusinessProfileIdAndStatus(
            businessProfileId, ComplaintStatus.APPROVED);
    }

    @Transactional
    public ComplaintResponse approve(UUID complaintId, String adminNote) {
        BusinessComplaint complaint = complaintRepo.findById(complaintId)
            .orElseThrow(() -> new ResourceNotFoundException("Şikayet bulunamadı."));
        if (complaint.getStatus() != ComplaintStatus.PENDING) {
            throw new BusinessRuleException("Bu şikayet zaten incelenmiş.");
        }
        complaint.approve(adminNote);
        return toResponse(complaint, resolveBusinessName(complaint.getBusinessProfileId()));
    }

    @Transactional
    public void reject(UUID complaintId, String adminNote) {
        BusinessComplaint complaint = complaintRepo.findById(complaintId)
            .orElseThrow(() -> new ResourceNotFoundException("Şikayet bulunamadı."));
        if (complaint.getStatus() != ComplaintStatus.PENDING) {
            throw new BusinessRuleException("Bu şikayet zaten incelenmiş.");
        }
        complaint.reject(adminNote);
    }

    public List<ComplaintResponse> getPendingComplaints() {
        return complaintRepo.findAllByStatusOrderByCreatedAtDesc(ComplaintStatus.PENDING).stream()
            .map(c -> toResponse(c, resolveBusinessName(c.getBusinessProfileId())))
            .toList();
    }

    private ComplaintResponse toResponse(BusinessComplaint c, String businessName) {
        return new ComplaintResponse(
            c.getId(),
            c.getBusinessProfileId(),
            businessName,
            c.getReason(),
            c.getDescription(),
            c.getStatus(),
            c.getAdminNote(),
            c.getCreatedAt(),
            c.getReviewedAt());
    }

    private String resolveBusinessName(UUID businessProfileId) {
        return businessRepo.findById(businessProfileId)
            .map(BusinessProfile::getBusinessName)
            .orElse("İşletme");
    }

    private Map<UUID, BusinessProfile> loadBusinesses(List<BusinessComplaint> complaints) {
        Map<UUID, BusinessProfile> map = new HashMap<>();
        for (BusinessComplaint c : complaints) {
            map.computeIfAbsent(c.getBusinessProfileId(), id ->
                businessRepo.findById(id).orElse(null));
        }
        return map;
    }
}
