package com.takkas.modules.swap.service;

import com.takkas.common.exception.ForbiddenException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.swap.api.dto.CreateSwapOfferMessageRequest;
import com.takkas.modules.swap.api.dto.SwapOfferMessageResponse;
import com.takkas.modules.swap.domain.SwapOfferMessage;
import com.takkas.modules.swap.repository.SwapOfferMessageRepository;
import com.takkas.modules.swap.repository.SwapOfferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SwapOfferMessageService {

    private final SwapOfferRepository swapOfferRepository;
    private final SwapOfferMessageRepository messageRepository;

    @Transactional(readOnly = true)
    public List<SwapOfferMessageResponse> listMessages(UUID offerId, UserPrincipal principal) {
        var offer = swapOfferRepository.findById(offerId)
            .orElseThrow(() -> new ResourceNotFoundException("Teklif bulunamadı."));
        var listing = offer.getSwapListing();
        ensureParticipant(offer.getOffererId(), listing.getOwnerId(), principal.profileId());

        return messageRepository.findAllBySwapOfferIdOrderByCreatedAtAsc(offerId).stream()
            .map(m -> toResponse(m, principal.profileId()))
            .toList();
    }

    @Transactional
    public SwapOfferMessageResponse sendMessage(
        UUID offerId,
        UserPrincipal principal,
        CreateSwapOfferMessageRequest req
    ) {
        var offer = swapOfferRepository.findById(offerId)
            .orElseThrow(() -> new ResourceNotFoundException("Teklif bulunamadı."));
        var listing = offer.getSwapListing();
        ensureParticipant(offer.getOffererId(), listing.getOwnerId(), principal.profileId());

        var saved = messageRepository.save(SwapOfferMessage.builder()
            .swapOfferId(offerId)
            .senderId(principal.profileId())
            .body(req.body().trim())
            .build());
        return toResponse(saved, principal.profileId());
    }

    private static void ensureParticipant(UUID offererId, UUID ownerId, UUID requesterId) {
        if (!offererId.equals(requesterId) && !ownerId.equals(requesterId)) {
            throw new ForbiddenException("Bu takas sohbetine erişim yetkiniz yok.");
        }
    }

    private static SwapOfferMessageResponse toResponse(SwapOfferMessage m, UUID viewerId) {
        return new SwapOfferMessageResponse(
            m.getId(),
            m.getSwapOfferId(),
            m.getSenderId(),
            m.getBody(),
            m.getCreatedAt(),
            m.getSenderId().equals(viewerId)
        );
    }
}
