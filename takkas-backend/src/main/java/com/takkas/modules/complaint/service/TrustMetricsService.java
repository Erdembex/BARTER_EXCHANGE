package com.takkas.modules.complaint.service;

import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.complaint.repository.BusinessComplaintRepository;
import com.takkas.modules.complaint.repository.IndividualComplaintRepository;
import com.takkas.modules.complaint.domain.enums.ComplaintStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TrustMetricsService {

    public static final double DANGER_THRESHOLD = 0.30;

    private static final EnumSet<ApplicationStatus> COMPLETED = EnumSet.of(
        ApplicationStatus.SUBMISSION_APPROVED, ApplicationStatus.REWARDED);

    private final ApplicationRepository applicationRepository;
    private final BusinessComplaintRepository businessComplaintRepository;
    private final IndividualComplaintRepository individualComplaintRepository;

    public TrustMetrics getForBusiness(UUID businessProfileId) {
        long completed = applicationRepository.countByBusinessIdAndStatusIn(businessProfileId, COMPLETED);
        long complaints = businessComplaintRepository.countByBusinessProfileIdAndStatus(
            businessProfileId, ComplaintStatus.APPROVED);
        return TrustMetrics.of(completed, complaints);
    }

    public TrustMetrics getForIndividual(UUID individualProfileId) {
        long completed = applicationRepository.countByIndividualIdAndStatusIn(individualProfileId, COMPLETED);
        long complaints = individualComplaintRepository.countByIndividualProfileIdAndStatus(
            individualProfileId, ComplaintStatus.APPROVED);
        return TrustMetrics.of(completed, complaints);
    }

    public Map<UUID, TrustMetrics> batchForBusinesses(Collection<UUID> businessProfileIds) {
        Map<UUID, TrustMetrics> result = new HashMap<>();
        for (UUID id : businessProfileIds) {
            if (id != null) {
                result.put(id, getForBusiness(id));
            }
        }
        return result;
    }

    public record TrustMetrics(long completedTaskCount, long approvedComplaintCount, double complaintRate,
                               boolean isDangerous) {
        public static TrustMetrics of(long completed, long complaints) {
            double rate = completed > 0 ? (double) complaints / completed : 0.0;
            boolean dangerous = completed > 0 && rate >= DANGER_THRESHOLD;
            return new TrustMetrics(completed, complaints, rate, dangerous);
        }
    }
}
