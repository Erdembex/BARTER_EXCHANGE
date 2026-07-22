package com.takkas.modules.notification.repository;

import com.takkas.modules.notification.domain.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("""
        SELECT n FROM Notification n
        WHERE n.userId = :userId
          AND n.createdAt < :cursor
        ORDER BY n.createdAt DESC
        """)
    List<Notification> findByUserWithCursor(
        @Param("userId") UUID userId,
        @Param("cursor") Instant cursor,
        Pageable pageable
    );

    long countByUserIdAndIsReadFalse(UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    int markAllReadByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("""
        UPDATE Notification n SET n.isRead = true
        WHERE n.userId = :userId AND n.referenceId = :referenceId AND n.isRead = false
        """)
    int markReadByReference(@Param("userId") UUID userId, @Param("referenceId") UUID referenceId);

    @Modifying
    @Query("""
        UPDATE Notification n SET n.isRead = true
        WHERE n.id = :id AND n.userId = :userId AND n.isRead = false
        """)
    int markReadById(@Param("userId") UUID userId, @Param("id") UUID id);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.createdAt < :threshold AND n.isRead = true")
    int deleteOldReadNotifications(@Param("threshold") Instant threshold);
}
