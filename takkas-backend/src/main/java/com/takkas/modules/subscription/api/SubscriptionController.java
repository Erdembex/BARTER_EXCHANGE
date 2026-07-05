package com.takkas.modules.subscription.api;

import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.common.security.*;
import com.takkas.modules.subscription.api.dto.*;
import com.takkas.modules.subscription.listener.StripeWebhookHandler;
import com.takkas.modules.subscription.mapper.SubscriptionMapper;
import com.takkas.modules.subscription.repository.*;
import com.takkas.modules.subscription.service.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Abonelik", description = "Planlar, Stripe ödeme, fatura yönetimi")
@RestController
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final StripeService stripeService;
    private final StripeWebhookHandler webhookHandler;
    private final SubscriptionPlanRepository planRepository;
    private final BusinessSubscriptionRepository subscriptionRepository;
    private final SubscriptionInvoiceRepository invoiceRepository;

    @GetMapping("/api/plans")
    public List<PlanResponse> getPlans() {
        return planRepository.findAllActiveWithFeatures()
            .stream().map(SubscriptionMapper::toPlanResponse).toList();
    }

    @GetMapping("/api/business/subscription")
    @PreAuthorize("hasRole('BUSINESS')")
    public SubscriptionResponse getMySubscription(@CurrentUser UserPrincipal p) {
        var sub = subscriptionRepository.findByBusinessId(p.profileId())
            .orElseThrow(() -> new ResourceNotFoundException("Abonelik bulunamadı."));
        return SubscriptionMapper.toResponse(sub);
    }

    @GetMapping("/api/business/subscription/invoices")
    @PreAuthorize("hasRole('BUSINESS')")
    public List<InvoiceResponse> getInvoices(@CurrentUser UserPrincipal p) {
        var sub = subscriptionRepository.findByBusinessId(p.profileId())
            .orElseThrow(() -> new ResourceNotFoundException("Abonelik bulunamadı."));
        return invoiceRepository.findAllBySubscriptionIdOrderByCreatedAtDesc(sub.getId())
            .stream().map(SubscriptionMapper::toInvoiceResponse).toList();
    }

    @PostMapping("/api/business/subscription/checkout")
    @PreAuthorize("hasRole('BUSINESS')")
    public CheckoutResponse createCheckout(@CurrentUser UserPrincipal p,
                                            @Valid @RequestBody CheckoutRequest req) {
        var sub = subscriptionRepository.findByBusinessId(p.profileId())
            .orElseThrow(() -> new ResourceNotFoundException("Abonelik bulunamadı."));
        String priceId = req.billingPeriod() == com.takkas.modules.subscription.domain.enums.BillingPeriod.YEARLY
            ? sub.getPlan().getStripePriceIdYearly()
            : sub.getPlan().getStripePriceIdMonthly();
        return new CheckoutResponse(stripeService.createCheckoutSession(
            p.profileId(), priceId, sub.getStripeCustomerId()));
    }

    @PostMapping("/api/business/subscription/portal")
    @PreAuthorize("hasRole('BUSINESS')")
    public PortalResponse createPortal(@CurrentUser UserPrincipal p) {
        var sub = subscriptionRepository.findByBusinessId(p.profileId())
            .orElseThrow(() -> new ResourceNotFoundException("Abonelik bulunamadı."));
        if (sub.getStripeCustomerId() == null)
            throw new com.takkas.common.exception.BusinessRuleException("Önce bir plan satın alın.");
        return new PortalResponse(stripeService.createBillingPortalSession(sub.getStripeCustomerId()));
    }

    @PostMapping("/api/business/subscription/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('BUSINESS')")
    public void cancelSubscription(@CurrentUser UserPrincipal p) {
        subscriptionService.cancelAtPeriodEnd(p.profileId());
    }

    @PostMapping("/api/webhooks/stripe")
    public ResponseEntity<Void> stripeWebhook(@RequestBody String payload,
                                               @RequestHeader("Stripe-Signature") String sig) {
        webhookHandler.handleWebhook(payload, sig);
        return ResponseEntity.ok().build();
    }
}
