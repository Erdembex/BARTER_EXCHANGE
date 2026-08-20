package com.takkas.modules.messaging.listener;

import com.takkas.common.event.ApplicationAcceptedEvent;
import com.takkas.common.event.ApplicationReceivedEvent;
import com.takkas.modules.messaging.domain.Conversation;
import com.takkas.modules.messaging.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class ConversationEventListener {

    private final ConversationRepository conversationRepository;

    /** Başvuru alındığında sohbet açılır — işletme onay öncesi soru sorabilir. */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onApplicationReceived(ApplicationReceivedEvent event) {
        openConversationIfMissing(
            event.applicationId(), event.businessUserId(), event.individualUserId());
    }

    /** Eski kayıtlar / geriye dönük uyumluluk */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void onApplicationAccepted(ApplicationAcceptedEvent event) {
        openConversationIfMissing(
            event.applicationId(), event.businessUserId(), event.individualUserId());
    }

    private void openConversationIfMissing(
        UUID applicationId, UUID businessUserId, UUID individualUserId
    ) {
        if (conversationRepository.existsByApplicationId(applicationId)) return;
        conversationRepository.save(Conversation.builder()
            .applicationId(applicationId)
            .businessUserId(businessUserId)
            .individualUserId(individualUserId)
            .build());
        log.info("[ConversationEventListener] Konuşma açıldı: {}", applicationId);
    }
}
