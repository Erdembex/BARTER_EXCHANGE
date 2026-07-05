package com.takkas.modules.auth.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.security.JwtTokenProvider;
import com.takkas.modules.auth.api.dto.*;
import com.takkas.modules.auth.domain.RefreshToken;
import com.takkas.modules.auth.repository.RefreshTokenRepository;
import com.takkas.modules.subscription.service.SubscriptionService;
import com.takkas.modules.user.domain.*;
import com.takkas.modules.user.domain.enums.*;
import com.takkas.modules.user.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class RegisterService {

    private final UserRepository userRepository;
    private final BusinessProfileRepository businessProfileRepository;
    private final IndividualProfileRepository individualProfileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final SubscriptionService subscriptionService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthResponse registerBusiness(BusinessRegisterRequest req) {
        validateEmailUnique(req.email());

        User user = userRepository.save(User.builder()
            .email(req.email())
            .passwordHash(passwordEncoder.encode(req.password()))
            .userType(UserType.BUSINESS)
            .status(UserStatus.ACTIVE)
            .build());

        BusinessProfile profile = businessProfileRepository.save(
            BusinessProfile.builder()
                .user(user)
                .businessName(req.businessName())
                .category(req.category())
                .city(req.city())
                .district(req.district())
                .phone(req.phone())
                .build());

        subscriptionService.assignFreePlan(profile.getId());

        return buildAuthResponse(user, profile.getId());
    }

    public AuthResponse registerIndividual(IndividualRegisterRequest req) {
        validateEmailUnique(req.email());

        User user = userRepository.save(User.builder()
            .email(req.email())
            .passwordHash(passwordEncoder.encode(req.password()))
            .userType(UserType.INDIVIDUAL)
            .status(UserStatus.ACTIVE)
            .build());

        IndividualProfile profile = IndividualProfile.builder()
            .user(user).fullName(req.fullName())
            .city(req.city()).district(req.district())
            .build();

        req.skills().forEach(skill ->
            profile.getSkills().add(new IndividualSkill(profile, skill)));

        individualProfileRepository.save(profile);

        return buildAuthResponse(user, profile.getId());
    }

    private void validateEmailUnique(String email) {
        if (userRepository.existsByEmail(email))
            throw new BusinessRuleException("Bu e-posta adresi zaten kayıtlı.");
    }

    private AuthResponse buildAuthResponse(User user, UUID profileId) {
        String accessToken  = tokenProvider.generateAccessToken(user, profileId);
        String refreshToken = createRefreshToken(user);
        return new AuthResponse(accessToken, refreshToken,
                                user.getUserType().name(), profileId);
    }

    private String createRefreshToken(User user) {
        return refreshTokenRepository.save(RefreshToken.builder()
            .user(user)
            .token(UUID.randomUUID().toString())
            .expiresAt(Instant.now().plus(7, ChronoUnit.DAYS))
            .build()).getToken();
    }
}
