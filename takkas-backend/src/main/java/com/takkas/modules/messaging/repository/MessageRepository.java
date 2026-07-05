package com.takkas.modules.messaging.repository;

import com.takkas.modules.messaging.domain.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("""
        SELECT m FROM Message m
        WHERE m.conversation.id = :cid
          AND m.createdAt < COALESCE(:cursor, :#{T(java.time.Instant).MAX})
        ORDER BY m.createdAt DESC
        """)
    List<Message> findByConversationWithCursor(
        @Param("cid") UUID cid,
        @Param("cursor") Instant cursor,
        Pageable pageable
    );

    @Modifying
    @Query("""
        UPDATE Message m SET m.isRead = true
        WHERE m.conversation.id = :cid AND m.senderId != :uid AND m.isRead = false
        """)
    int markAllAsRead(@Param("cid") UUID cid, @Param("uid") UUID uid);
}
