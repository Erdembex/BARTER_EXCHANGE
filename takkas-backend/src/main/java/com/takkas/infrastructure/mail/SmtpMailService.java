package com.takkas.infrastructure.mail;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * SMTP mail implementasyonu.
 * spring-boot-starter-mail bağımlılığı eklendiğinde
 * JavaMailSender ile implementasyon yapılacak.
 */
@Service
@Slf4j
public class SmtpMailService implements MailService {

    @Value("${app.base-url}")
    private String baseUrl;

    @Override
    public void sendVerificationEmail(String to, String token) {
        String link = baseUrl + "/api/auth/verify-email?token=" + token;
        log.info("[MailService] Doğrulama e-postası gönderildi: to={} link={}", to, link);
        // TODO: JavaMailSender implementasyonu
    }

    @Override
    public void sendPasswordResetEmail(String to, String token) {
        log.info("[MailService] Şifre sıfırlama e-postası: to={}", to);
        // TODO: JavaMailSender implementasyonu
    }

    @Override
    public void sendGenericEmail(String to, String subject, String body) {
        log.info("[MailService] E-posta: to={} subject={}", to, subject);
        // TODO: JavaMailSender implementasyonu
    }
}
