package com.takkas.modules.auth.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.infrastructure.mail.MailService;
import com.takkas.modules.auth.api.dto.ChangePasswordRequest;
import com.takkas.modules.auth.api.dto.ForgotPasswordRequest;
import com.takkas.modules.auth.api.dto.ResetPasswordRequest;
import com.takkas.modules.auth.domain.PasswordResetToken;
import com.takkas.modules.auth.repository.PasswordResetTokenRepository;
import com.takkas.modules.auth.repository.RefreshTokenRepository;
import com.takkas.modules.user.domain.User;
import com.takkas.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordService {

    private static final int TOKEN_TTL_HOURS = 1;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;

    /**
     * Güvenlik: hesap var/yok bilgisini sızdırmaz; her zaman başarılı kabul edilir.
     */
    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest req) {
        userRepository.findByEmail(req.email().trim()).ifPresent(user -> {
            String token = generateResetToken();
            Instant expiresAt = Instant.now().plus(TOKEN_TTL_HOURS, ChronoUnit.HOURS);

            PasswordResetToken resetToken = resetTokenRepository.save(PasswordResetToken.builder()
                .user(user)
                .token(token)
                .expiresAt(expiresAt)
                .build());

            resetTokenRepository.invalidateOtherTokens(user.getId(), resetToken.getId(), Instant.now());

            try {
                mailService.sendPasswordResetEmail(user.getEmail(), token);
            } catch (Exception ex) {
                log.warn("Şifre sıfırlama e-postası gönderilemedi ({}): {}", user.getEmail(), ex.getMessage());
            }

            log.info("[PasswordReset] Kod oluşturuldu: email={} token={} expires={}",
                user.getEmail(), token, expiresAt);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        String normalizedToken = req.token().trim().toUpperCase();
        PasswordResetToken resetToken = resetTokenRepository.findByToken(normalizedToken)
            .orElseThrow(() -> new BusinessRuleException("Geçersiz veya süresi dolmuş sıfırlama kodu."));

        if (!resetToken.isValid()) {
            throw new BusinessRuleException("Geçersiz veya süresi dolmuş sıfırlama kodu.");
        }

        User user = resetToken.getUser();
        if (passwordEncoder.matches(req.newPassword(), user.getPasswordHash())) {
            throw new BusinessRuleException("Yeni şifre mevcut şifre ile aynı olamaz.");
        }

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);

        resetToken.setUsedAt(Instant.now());
        resetTokenRepository.save(resetToken);
        resetTokenRepository.invalidateOtherTokens(user.getId(), resetToken.getId(), Instant.now());
        refreshTokenRepository.revokeAllByUserId(user.getId());
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Kullanıcı bulunamadı."));

        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new BusinessRuleException("Mevcut şifre hatalı.");
        }
        if (passwordEncoder.matches(req.newPassword(), user.getPasswordHash())) {
            throw new BusinessRuleException("Yeni şifre mevcut şifre ile aynı olamaz.");
        }

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    private String generateResetToken() {
        final String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder code = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            code.append(alphabet.charAt(RANDOM.nextInt(alphabet.length())));
        }
        return code.toString();
    }
}
