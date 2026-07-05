package com.takkas.modules.subscription.service;

import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import com.takkas.common.exception.BusinessRuleException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@Slf4j
public class StripeService {

    @Value("${stripe.secret-key}")   private String stripeSecretKey;
    @Value("${stripe.webhook-secret}") private String webhookSecret;
    @Value("${app.base-url}")        private String baseUrl;

    @PostConstruct
    public void init() { Stripe.apiKey = stripeSecretKey; }

    public String createCheckoutSession(UUID businessId, String stripePriceId, String customerId) {
        try {
            SessionCreateParams.Builder builder = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                .setSuccessUrl(baseUrl + "/subscription/success?session_id={CHECKOUT_SESSION_ID}")
                .setCancelUrl(baseUrl + "/subscription/cancel")
                .addLineItem(SessionCreateParams.LineItem.builder()
                    .setPrice(stripePriceId).setQuantity(1L).build())
                .putMetadata("businessId", businessId.toString());
            if (customerId != null) builder.setCustomer(customerId);
            return Session.create(builder.build()).getUrl();
        } catch (StripeException e) {
            log.error("[StripeService] Checkout session hatası: {}", e.getMessage());
            throw new BusinessRuleException("Ödeme oturumu oluşturulamadı.");
        }
    }

    public String createBillingPortalSession(String stripeCustomerId) {
        try {
            return com.stripe.model.billingportal.Session.create(
                com.stripe.param.billingportal.SessionCreateParams.builder()
                    .setCustomer(stripeCustomerId)
                    .setReturnUrl(baseUrl + "/subscription")
                    .build()
            ).getUrl();
        } catch (StripeException e) {
            throw new BusinessRuleException("Fatura portalı açılamadı.");
        }
    }

    public Event constructWebhookEvent(String payload, String sigHeader) {
        try { return Webhook.constructEvent(payload, sigHeader, webhookSecret); }
        catch (SignatureVerificationException e) {
            throw new BusinessRuleException("Geçersiz webhook imzası.");
        }
    }
}
