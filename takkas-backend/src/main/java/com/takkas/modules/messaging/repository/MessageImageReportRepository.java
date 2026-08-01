package com.takkas.modules.messaging.repository;

import com.takkas.modules.messaging.domain.MessageImageReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MessageImageReportRepository extends JpaRepository<MessageImageReport, UUID> {

    boolean existsByMessageIdAndReporterUserId(UUID messageId, UUID reporterUserId);
}
