package com.takkas.modules.complaint.service;

import com.takkas.modules.complaint.api.dto.ComplaintModerationResponse;
import com.takkas.modules.complaint.domain.enums.ComplaintTargetType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ComplaintModerationService {

    private final ComplaintService businessComplaintService;
    private final IndividualComplaintService individualComplaintService;

    public List<ComplaintModerationResponse> getPendingComplaints() {
        List<ComplaintModerationResponse> items = new ArrayList<>();
        businessComplaintService.getPendingComplaints().forEach(c ->
            items.add(new ComplaintModerationResponse(
                c.id(),
                ComplaintTargetType.BUSINESS,
                c.businessProfileId(),
                c.businessName(),
                c.reason(),
                c.description(),
                c.status(),
                c.adminNote(),
                c.createdAt(),
                c.reviewedAt())));
        individualComplaintService.getPendingComplaints().forEach(c ->
            items.add(new ComplaintModerationResponse(
                c.id(),
                ComplaintTargetType.INDIVIDUAL,
                c.individualProfileId(),
                c.individualDisplayName(),
                c.reason(),
                c.description(),
                c.status(),
                c.adminNote(),
                c.createdAt(),
                c.reviewedAt())));
        items.sort(Comparator.comparing(ComplaintModerationResponse::createdAt,
            Comparator.nullsLast(Comparator.reverseOrder())));
        return items;
    }

    @Transactional
    public ComplaintModerationResponse approve(ComplaintTargetType targetType, UUID id, String note) {
        if (targetType == ComplaintTargetType.BUSINESS) {
            var c = businessComplaintService.approve(id, note);
            return new ComplaintModerationResponse(
                c.id(), ComplaintTargetType.BUSINESS, c.businessProfileId(), c.businessName(),
                c.reason(), c.description(), c.status(), c.adminNote(), c.createdAt(), c.reviewedAt());
        }
        var c = individualComplaintService.approve(id, note);
        return new ComplaintModerationResponse(
            c.id(), ComplaintTargetType.INDIVIDUAL, c.individualProfileId(), c.individualDisplayName(),
            c.reason(), c.description(), c.status(), c.adminNote(), c.createdAt(), c.reviewedAt());
    }

    @Transactional
    public void reject(ComplaintTargetType targetType, UUID id, String note) {
        if (targetType == ComplaintTargetType.BUSINESS) {
            businessComplaintService.reject(id, note);
        } else {
            individualComplaintService.reject(id, note);
        }
    }
}
