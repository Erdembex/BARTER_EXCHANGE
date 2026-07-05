package com.takkas.infrastructure.mail;

public interface MailService {
    void sendVerificationEmail(String to, String token);
    void sendPasswordResetEmail(String to, String token);
    void sendGenericEmail(String to, String subject, String body);
}
