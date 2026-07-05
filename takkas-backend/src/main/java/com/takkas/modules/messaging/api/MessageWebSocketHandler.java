package com.takkas.modules.messaging.api;

import com.takkas.modules.messaging.api.dto.SendMessageRequest;
import com.takkas.modules.messaging.api.dto.TypingEvent;
import com.takkas.modules.messaging.service.MessageBufferService;
import com.takkas.modules.messaging.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
@Slf4j
public class MessageWebSocketHandler {

    private final MessageBufferService bufferService;
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/conversation/{cid}/send")
    public void sendMessage(@DestinationVariable UUID cid,
                             @Payload SendMessageRequest req,
                             SimpMessageHeaderAccessor acc) {
        messageService.sendText(cid, getSenderId(acc), req.content());
    }

    @MessageMapping("/conversation/{cid}/typing")
    public void typing(@DestinationVariable UUID cid, SimpMessageHeaderAccessor acc) {
        UUID senderId = getSenderId(acc);
        bufferService.setTyping(cid, senderId);
        messagingTemplate.convertAndSend("/topic/conversation/" + cid + "/typing",
            new TypingEvent(senderId, cid, true));
    }

    @MessageMapping("/heartbeat")
    public void heartbeat(SimpMessageHeaderAccessor acc) {
        bufferService.heartbeat(getSenderId(acc));
    }

    private UUID getSenderId(SimpMessageHeaderAccessor acc) {
        Map<String, Object> attrs = acc.getSessionAttributes();
        if (attrs == null) throw new com.takkas.common.exception.BusinessRuleException("Oturum bulunamadı.");
        return (UUID) attrs.get("userId");
    }
}
