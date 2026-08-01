package com.takkas.modules.admin.api;

import com.takkas.modules.subscription.api.dto.PendingUpgradeResponse;
import com.takkas.modules.subscription.api.dto.SubscriptionResponse;
import com.takkas.modules.subscription.mapper.SubscriptionMapper;
import com.takkas.modules.subscription.service.SubscriptionService;
import com.takkas.modules.user.domain.BusinessProfile;
import com.takkas.modules.user.repository.BusinessProfileRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Sanal POS bağlanana kadar: işletmelerin abonelik yükseltme taleplerini admin burada
 * manuel olarak onaylar/reddeder. Bkz. {@link com.takkas.modules.subscription.payment.PaymentGateway}.
 */
@Tag(name = "Admin Abonelik", description = "Manuel ödeme onayı (sanal POS bağlanana kadar)")
@RestController
@RequestMapping("/api/admin/subscriptions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminSubscriptionController {

    private final SubscriptionService subscriptionService;
    private final BusinessProfileRepository businessProfileRepository;

    @GetMapping("/pending")
    public List<PendingUpgradeResponse> getPendingUpgrades() {
        return subscriptionService.getPendingUpgrades().stream()
            .map(sub -> {
                String businessName = businessProfileRepository.findById(sub.getBusinessId())
                    .map(BusinessProfile::getBusinessName).orElse("İşletme");
                return SubscriptionMapper.toPendingUpgradeResponse(sub, businessName);
            })
            .toList();
    }

    @PostMapping("/{businessId}/confirm-payment")
    public SubscriptionResponse confirmPayment(@PathVariable UUID businessId) {
        return SubscriptionMapper.toResponse(subscriptionService.confirmPendingUpgrade(businessId));
    }

    @PostMapping("/{businessId}/reject-payment")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rejectPayment(@PathVariable UUID businessId) {
        subscriptionService.rejectPendingUpgrade(businessId);
    }
}
