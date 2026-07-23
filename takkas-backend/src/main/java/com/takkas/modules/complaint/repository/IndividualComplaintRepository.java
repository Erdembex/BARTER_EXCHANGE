package com.takkas.modules.complaint.repository;

import com.takkas.modules.complaint.domain.IndividualComplaint;
import com.takkas.modules.complaint.domain.enums.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface IndividualComplaintRepository extends JpaRepository<IndividualComplaint, UUID> {

    List<IndividualComplaint> findAllByReporterUserIdOrderByCreatedAtDesc(UUID reporterUserId);

    List<IndividualComplaint> findAllByStatusOrderByCreatedAtDesc(ComplaintStatus status);

    boolean existsByReporterUserIdAndIndividualProfileIdAndStatus(
        UUID reporterUserId, UUID individualProfileId, ComplaintStatus status);

    boolean existsByReporterUserIdAndApplicationIdAndStatus(
        UUID reporterUserId, UUID applicationId, ComplaintStatus status);

    boolean existsByApplicationIdAndStatus(UUID applicationId, ComplaintStatus status);

    long countByIndividualProfileIdAndStatus(UUID individualProfileId, ComplaintStatus status);
}
