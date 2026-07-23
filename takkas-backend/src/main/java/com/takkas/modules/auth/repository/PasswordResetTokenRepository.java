package com.takkas.modules.auth.repository;

import com.takkas.modules.auth.domain.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByToken(String token);

    @Modifying
    @Query("""
        UPDATE PasswordResetToken t
        SET t.usedAt = :now
        WHERE t.user.id = :userId AND t.usedAt IS NULL AND t.id <> :keepId
        """)
    void invalidateOtherTokens(@Param("userId") UUID userId,
                               @Param("keepId") UUID keepId,
                               @Param("now") Instant now);

    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :now OR t.usedAt IS NOT NULL")
    void deleteExpiredAndUsed(@Param("now") Instant now);
}
