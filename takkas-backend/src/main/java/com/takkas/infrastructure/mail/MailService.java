package com.takkas.infrastructure.mail;

public interface MailService {
    void sendVerificationEmail(String to, String token);
    /** @return true if message was handed off to SMTP */
    boolean sendPasswordResetEmail(String to, String token);
    void sendGenericEmail(String to, String subject, String body);
}
