package com.takkas.modules.swap.repository;

import com.takkas.modules.swap.domain.SwapOfferMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SwapOfferMessageRepository extends JpaRepository<SwapOfferMessage, UUID> {
    List<SwapOfferMessage> findAllBySwapOfferIdOrderByCreatedAtAsc(UUID swapOfferId);
}
