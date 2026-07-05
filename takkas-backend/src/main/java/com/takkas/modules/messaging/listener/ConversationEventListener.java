package com.takkas.modules.messaging.listener;

import com.takkas.common.event.ApplicationAcceptedEvent;
import com.takkas.modules.messaging.domain.Conversation;
import com.takkas.modules.messaging.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class ConversationEventListener {

    private final ConversationRepository conversationRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onApplicationAccepted(ApplicationAcceptedEvent event) {
        if (conversationRepository.existsByApplicationId(event.applicationId())) return;
        conversationRepository.save(Conversation.builder()
            .applicationId(event.applicationId())
            .businessUserId(event.businessUserId())
            .individualUserId(event.individualUserId())
            .build());
        log.info("[ConversationEventListener] Konuşma açıldı: {}", event.applicationId());
    }
}
