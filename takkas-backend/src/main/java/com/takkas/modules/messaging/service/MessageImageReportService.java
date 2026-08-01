package com.takkas.modules.messaging.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.modules.messaging.api.dto.MessageImageReportResponse;
import com.takkas.modules.messaging.api.dto.ReportMessageImageRequest;
import com.takkas.modules.messaging.domain.Message;
import com.takkas.modules.messaging.domain.MessageImageReport;
import com.takkas.modules.messaging.domain.enums.MessageImageReportReason;
import com.takkas.modules.messaging.domain.enums.MessageType;
import com.takkas.modules.messaging.repository.ConversationRepository;
import com.takkas.modules.messaging.repository.MessageImageReportRepository;
import com.takkas.modules.messaging.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageImageReportService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final MessageImageReportRepository reportRepository;

    @Transactional
    public MessageImageReportResponse report(
        UUID conversationId,
        UUID messageId,
        UUID reporterUserId,
        ReportMessageImageRequest req
    ) {
        if (!conversationRepository.isParticipant(conversationId, reporterUserId)) {
            throw new BusinessRuleException("Erişim yetkiniz yok.");
        }

        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new BusinessRuleException("Mesaj bulunamadı."));
        if (!message.getConversation().getId().equals(conversationId)) {
            throw new BusinessRuleException("Mesaj bu sohbete ait değil.");
        }
        if (message.getMessageType() != MessageType.IMAGE) {
            throw new BusinessRuleException("Yalnızca sohbet görselleri şikayet edilebilir.");
        }
        if (message.getMediaUrl() == null || message.getMediaUrl().isBlank()) {
            throw new BusinessRuleException("Görsel bulunamadı.");
        }
        if (message.getSenderId().equals(reporterUserId)) {
            throw new BusinessRuleException("Kendi gönderdiğin görseli şikayet edemezsin.");
        }
        if (reportRepository.existsByMessageIdAndReporterUserId(messageId, reporterUserId)) {
            throw new BusinessRuleException("Bu görseli zaten şikayet ettin.");
        }

        String description = req.description().trim();
        if (req.reason() == MessageImageReportReason.OTHER && description.length() < 10) {
            throw new BusinessRuleException("Diğer seçeneği için en az 10 karakter açıklama gerekli.");
        }

        MessageImageReport saved = reportRepository.save(MessageImageReport.builder()
            .messageId(messageId)
            .conversationId(conversationId)
            .reporterUserId(reporterUserId)
            .reportedUserId(message.getSenderId())
            .mediaUrl(message.getMediaUrl())
            .reason(req.reason())
            .description(description)
            .build());

        return new MessageImageReportResponse(
            saved.getId(),
            saved.getMessageId(),
            saved.getReason(),
            saved.getDescription(),
            saved.getCreatedAt()
        );
    }
}
