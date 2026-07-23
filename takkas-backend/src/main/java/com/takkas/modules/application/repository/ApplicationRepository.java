package com.takkas.modules.application.repository;

import com.takkas.modules.application.domain.Application;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    List<Application> findAllByListingIdOrderByAppliedAtDesc(UUID listingId);
    List<Application> findAllByListingIdAndStatus(UUID listingId, ApplicationStatus status);
    List<Application> findAllByIndividualIdOrderByAppliedAtDesc(UUID individualId);
    List<Application> findAllByIndividualIdAndStatusInOrderByReviewedAtDesc(
        UUID individualId, Collection<ApplicationStatus> statuses);

    List<Application> findAllByBusinessIdAndStatusInOrderByAppliedAtDesc(
        UUID businessId, Collection<ApplicationStatus> statuses);
    List<Application> findAllByStatusOrderBySubmittedAtDesc(ApplicationStatus status);
    boolean existsByListingIdAndIndividualId(UUID listingId, UUID individualId);
    long countByListingIdAndStatus(UUID listingId, ApplicationStatus status);
    long countByListingId(UUID listingId);
    long countByBusinessIdAndStatusIn(UUID businessId, Collection<ApplicationStatus> statuses);
    long countByIndividualIdAndStatusIn(UUID individualId, Collection<ApplicationStatus> statuses);
}
