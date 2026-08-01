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
        LEFT JOIN FETCH m.offer
        WHERE m.conversation.id = :cid
          AND m.createdAt < :cursor
          AND (m.visibleToUserId IS NULL OR m.visibleToUserId = :viewerId)
        ORDER BY m.createdAt DESC
        """)
    List<Message> findByConversationWithCursor(
        @Param("cid") UUID cid,
        @Param("cursor") Instant cursor,
        @Param("viewerId") UUID viewerId,
        Pageable pageable
    );

    @Modifying
    @Query("""
        UPDATE Message m SET m.isRead = true
        WHERE m.conversation.id = :cid AND m.senderId != :uid AND m.isRead = false
        """)
    int markAllAsRead(@Param("cid") UUID cid, @Param("uid") UUID uid);

    @Query("""
        SELECT COUNT(m) > 0 FROM Message m
        JOIN m.conversation c
        WHERE m.messageType = com.takkas.modules.messaging.domain.enums.MessageType.IMAGE
          AND m.mediaUrl = :mediaUrl
          AND (c.businessUserId = :userId OR c.individualUserId = :userId)
        """)
    boolean participantCanAccessMediaUrl(
        @Param("userId") UUID userId,
        @Param("mediaUrl") String mediaUrl
    );
}
