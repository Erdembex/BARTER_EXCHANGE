package com.takkas.modules.auth.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.security.JwtTokenProvider;
import com.takkas.modules.auth.api.dto.AuthResponse;
import com.takkas.modules.auth.domain.RefreshToken;
import com.takkas.modules.auth.repository.RefreshTokenRepository;
import com.takkas.modules.user.domain.*;
import com.takkas.modules.user.domain.enums.UserType;
import com.takkas.modules.user.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class TokenRefreshService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final IndividualProfileRepository individualProfileRepository;
    private final JwtTokenProvider tokenProvider;

    public AuthResponse refresh(String rawToken) {
        RefreshToken rt = refreshTokenRepository.findByToken(rawToken)
            .orElseThrow(() -> new BusinessRuleException("Geçersiz token."));

        if (!rt.isValid()) {
            refreshTokenRepository.revokeAllByUserId(rt.getUser().getId());
            throw new BusinessRuleException("Token süresi dolmuş, lütfen tekrar giriş yapın.");
        }

        rt.setRevoked(true);

        String newToken = UUID.randomUUID().toString();
        refreshTokenRepository.save(RefreshToken.builder()
            .user(rt.getUser()).token(newToken)
            .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
            .build());

        UUID profileId = resolveProfileId(rt.getUser());
        String access  = tokenProvider.generateAccessToken(rt.getUser(), profileId);

        return new AuthResponse(access, newToken,
                                rt.getUser().getUserType().name(), profileId);
    }

    private UUID resolveProfileId(com.takkas.modules.user.domain.User user) {
        return switch (user.getUserType()) {
            case BUSINESS   -> businessProfileRepository.findByUserId(user.getId())
                                .map(BusinessProfile::getId).orElseThrow();
            case INDIVIDUAL -> individualProfileRepository.findByUserId(user.getId())
                                .map(IndividualProfile::getId).orElseThrow();
            case ADMIN      -> user.getId();
        };
    }
}
