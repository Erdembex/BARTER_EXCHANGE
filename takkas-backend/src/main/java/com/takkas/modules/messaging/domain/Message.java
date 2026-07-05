package com.takkas.modules.messaging.domain;

import com.takkas.modules.messaging.domain.enums.MessageType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages",
    indexes = @Index(name = "messages_conv_created_idx", columnList = "conversation_id, created_at DESC"))
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Message {

    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @Column(name = "sender_id", nullable = false) private UUID senderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private MessageType messageType = MessageType.TEXT;

    @Column(columnDefinition = "TEXT") private String content;
    @CreatedDate private Instant createdAt;
    @Column(nullable = false) @Builder.Default private boolean isRead = false;

    @OneToOne(mappedBy = "message", cascade = CascadeType.ALL,
              orphanRemoval = true, fetch = FetchType.LAZY, optional = true)
    private Offer offer;
}
