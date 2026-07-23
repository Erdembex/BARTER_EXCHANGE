package com.takkas.modules.feedback.repository;

import com.takkas.modules.feedback.domain.TaskFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskFeedbackRepository extends JpaRepository<TaskFeedback, UUID> {

    Optional<TaskFeedback> findByApplicationIdAndAuthorUserId(UUID applicationId, UUID authorUserId);

    List<TaskFeedback> findAllByTargetProfileIdOrderByCreatedAtDesc(UUID targetProfileId);

    @Query("SELECT AVG(f.stars) FROM TaskFeedback f WHERE f.targetProfileId = :targetProfileId")
    Double averageStarsByTargetProfileId(UUID targetProfileId);

    long countByTargetProfileId(UUID targetProfileId);
}
