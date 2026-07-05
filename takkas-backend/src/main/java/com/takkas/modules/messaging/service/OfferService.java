package com.takkas.modules.messaging.service;

import com.takkas.common.event.*;
import com.takkas.common.exception.*;
import com.takkas.modules.messaging.api.dto.*;
import com.takkas.modules.messaging.domain.*;
import com.takkas.modules.messaging.domain.enums.MessageType;
import com.takkas.modules.messaging.domain.enums.OfferStatus;
import com.takkas.modules.messaging.repository.*;
import com.takkas.modules.user.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class OfferService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final OfferRepository offerRepository;
    private final DomainEventPublisher eventPublisher;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserFacade userFacade;

    public OfferResponse sendOffer(UUID conversationId, UUID senderId, SendOfferRequest req) {
        Conversation conv = getWritable(conversationId, senderId);
        offerRepository.findPendingByConversationId(conversationId)
            .ifPresent(Offer::counter);
        Message message = messageRepository.save(Message.builder()
            .conversation(conv).senderId(senderId).messageType(MessageType.OFFER).build());
        Offer offer = offerRepository.save(Offer.builder()
            .message(message).rewardType(req.rewardType()).quantity(req.quantity())
            .unit(req.unit()).validityDays(req.validityDays()).note(req.note()).build());
        message.setOffer(offer);
        conv.markOfferPending();
        OfferResponse response = toOfferResponse(offer);
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId, response);
        return response;
    }

    public void acceptOffer(UUID conversationId, UUID acceptorId, UUID offerId) {
        Conversation conv = conversationRepository.findById(conversationId)
            .orElseThrow(() -> new ResourceNotFoundException("Konuşma bulunamadı."));
        if (!conv.isParticipant(acceptorId)) throw new ForbiddenException("Erişim yetkiniz yok.");
        Offer offer = offerRepository.findById(offerId)
            .orElseThrow(() -> new ResourceNotFoundException("Teklif bulunamadı."));
        if (offer.getMessage().getSenderId().equals(acceptorId))
            throw new BusinessRuleException("Kendi teklifinizi kabul edemezsiniz.");
        offer.accept();
        conv.agree();
        UUID businessId = userFacade.getBusinessProfileIdByUserId(conv.getBusinessUserId());
        eventPublisher.publish(new OfferAcceptedEvent(offer.getId(), conversationId,
            conv.getApplicationId(), businessId, conv.getIndividualUserId(),
            offer.getRewardType(), offer.getQuantity(), offer.getUnit(),
            offer.getValidityDays(), offer.getNote()));
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId,
            new OfferStatusUpdate(offerId, OfferStatus.ACCEPTED));
    }

    public void rejectOffer(UUID conversationId, UUID rejectorId, UUID offerId) {
        Conversation conv = getWritable(conversationId, rejectorId);
        Offer offer = offerRepository.findById(offerId)
            .orElseThrow(() -> new ResourceNotFoundException("Teklif bulunamadı."));
        if (offer.getMessage().getSenderId().equals(rejectorId))
            throw new BusinessRuleException("Kendi teklifinizi reddedemezsiniz.");
        offer.reject();
        conv.reopen();
        messagingTemplate.convertAndSend("/topic/conversation/" + conversationId,
            new OfferStatusUpdate(offerId, OfferStatus.REJECTED));
    }

    private Conversation getWritable(UUID cid, UUID userId) {
        Conversation conv = conversationRepository.findById(cid)
            .orElseThrow(() -> new ResourceNotFoundException("Konuşma bulunamadı."));
        if (!conv.isParticipant(userId)) throw new ForbiddenException("Erişim yetkiniz yok.");
        if (!conv.isWritable()) throw new BusinessRuleException("Bu konuşmaya işlem yapılamaz.");
        return conv;
    }

    private OfferResponse toOfferResponse(Offer o) {
        return new OfferResponse(o.getId(), o.getMessage().getId(), o.getRewardType(),
            o.getQuantity(), o.getUnit(), o.getValidityDays(), o.getNote(),
            o.getStatus(), o.getRespondedAt());
    }
}
