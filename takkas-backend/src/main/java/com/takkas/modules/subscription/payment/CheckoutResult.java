package com.takkas.modules.subscription.payment;

/**
 * @param requiresRedirect true ise frontend {@code redirectUrl}'i açmalı (gerçek ödeme sağlayıcısı akışı).
 * @param redirectUrl       requiresRedirect=true olduğunda dolu; aksi halde null.
 * @param message           kullanıcıya gösterilecek bilgi metni (manuel akışta talimatlar burada).
 * @param reference         talebi takip etmek için referans kod.
 */
public record CheckoutResult(boolean requiresRedirect, String redirectUrl, String message, String reference) {}
