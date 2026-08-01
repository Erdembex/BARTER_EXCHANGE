package com.takkas.modules.messaging.mapper;



import com.takkas.modules.listing.repository.ListingRepository;

import com.takkas.modules.messaging.api.dto.MessageResponse;

import com.takkas.modules.messaging.domain.Message;

import com.takkas.modules.messaging.domain.enums.MessageType;



public class MessageMapper {



    private MessageMapper() {}



    public static MessageResponse toResponse(Message m, ListingRepository listingRepository) {

        var offer = m.getMessageType() == MessageType.OFFER && m.getOffer() != null

            ? OfferMapper.toResponse(m.getOffer(), m, listingRepository)

            : null;

        return new MessageResponse(m.getId(), m.getConversation().getId(),

            m.getSenderId(), m.getMessageType(), m.getContent(), m.getMediaUrl(),

            m.getCreatedAt(), m.isRead(), offer);

    }

}

