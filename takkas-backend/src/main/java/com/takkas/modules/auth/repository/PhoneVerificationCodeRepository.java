package com.takkas.modules.auth.repository;

import com.takkas.modules.auth.domain.PhoneVerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface PhoneVerificationCodeRepository extends JpaRepository<PhoneVerificationCode, UUID> {

    Optional<PhoneVerificationCode> findTopByUserIdAndPhoneOrderByCreatedAtDesc(UUID userId, String phone);

    @Modifying
    @Query("""
        UPDATE PhoneVerificationCode c SET c.verifiedAt = :now
        WHERE c.user.id = :userId AND c.verifiedAt IS NULL AND c.id <> :keepId
        """)
    void invalidateOtherCodes(@Param("userId") UUID userId, @Param("keepId") UUID keepId, @Param("now") Instant now);
}
