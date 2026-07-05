package com.takkas.infrastructure.push;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "fcm_tokens",
    indexes = @Index(name = "fcm_tokens_user_idx", columnList = "user_id, is_active"))
@EntityListeners(AuditingEntityListener.class)
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class FcmToken {

    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;

    @Column(name = "user_id", nullable = false) private UUID userId;

    @Column(nullable = false, unique = true) private String token;

    @Enumerated(EnumType.STRING) private FcmPlatform platform;

    @Column(nullable = false) @Builder.Default private boolean isActive = true;

    @CreatedDate  private Instant createdAt;
    @LastModifiedDate private Instant updatedAt;
}
