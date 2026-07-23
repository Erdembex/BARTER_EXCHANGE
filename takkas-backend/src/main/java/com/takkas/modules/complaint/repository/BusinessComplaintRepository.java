package com.takkas.modules.complaint.repository;

import com.takkas.modules.complaint.domain.BusinessComplaint;
import com.takkas.modules.complaint.domain.enums.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BusinessComplaintRepository extends JpaRepository<BusinessComplaint, UUID> {

    List<BusinessComplaint> findAllByStatusOrderByCreatedAtDesc(ComplaintStatus status);

    List<BusinessComplaint> findAllByReporterUserIdOrderByCreatedAtDesc(UUID reporterUserId);

    boolean existsByReporterUserIdAndBusinessProfileIdAndStatus(
        UUID reporterUserId, UUID businessProfileId, ComplaintStatus status);

    boolean existsByReporterUserIdAndApplicationIdAndStatus(
        UUID reporterUserId, UUID applicationId, ComplaintStatus status);

    boolean existsByApplicationIdAndStatus(UUID applicationId, ComplaintStatus status);

    boolean existsByBusinessProfileIdAndStatus(UUID businessProfileId, ComplaintStatus status);

    long countByBusinessProfileIdAndStatus(UUID businessProfileId, ComplaintStatus status);
}
