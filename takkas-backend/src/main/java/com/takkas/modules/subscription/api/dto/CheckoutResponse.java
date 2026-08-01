package com.takkas.modules.subscription.api.dto;

/** requiresRedirect=true iken frontend redirectUrl'i açar; false iken message kullanıcıya gösterilir. */
public record CheckoutResponse(boolean requiresRedirect, String redirectUrl, String message, String reference) {}
