package com.takkas.modules.swap.repository;

import com.takkas.modules.swap.domain.SwapTrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SwapTradeRepository extends JpaRepository<SwapTrade, UUID> {
    Optional<SwapTrade> findBySwapListingId(UUID swapListingId);

    @Query("SELECT t FROM SwapTrade t WHERE t.initiatorNewOwnerId = :uid OR t.receiverNewOwnerId = :uid ORDER BY t.completedAt DESC")
    List<SwapTrade> findAllByParticipant(@Param("uid") UUID userId);
}
