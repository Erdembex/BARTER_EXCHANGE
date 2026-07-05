package com.takkas.modules.messaging.repository;

import com.takkas.modules.messaging.domain.Offer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface OfferRepository extends JpaRepository<Offer, UUID> {
    @Query("SELECT o FROM Offer o JOIN o.message m WHERE m.conversation.id = :cid AND o.status = 'PENDING'")
    Optional<Offer> findPendingByConversationId(@Param("cid") UUID conversationId);
}
