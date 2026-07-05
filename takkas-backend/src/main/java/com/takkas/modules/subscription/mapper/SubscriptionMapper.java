package com.takkas.modules.subscription.mapper;

import com.takkas.modules.subscription.api.dto.*;
import com.takkas.modules.subscription.domain.*;

import java.util.stream.Collectors;

public class SubscriptionMapper {

    public static PlanResponse toPlanResponse(SubscriptionPlan p) {
        return new PlanResponse(p.getId(), p.getName(), p.getDisplayName(),
            p.getPriceMonthly(), p.getPriceYearly(),
            p.getFeatures().stream()
                .collect(Collectors.toMap(PlanFeature::getFeatureKey, PlanFeature::getFeatureValue)));
    }

    public static SubscriptionResponse toResponse(BusinessSubscription s) {
        return new SubscriptionResponse(s.getId(), s.getPlan().getName(),
            s.getPlan().getDisplayName(), s.getStatus(), s.isCancelAtPeriodEnd(),
            s.getCurrentPeriodStart(), s.getCurrentPeriodEnd());
    }

    public static InvoiceResponse toInvoiceResponse(SubscriptionInvoice i) {
        return new InvoiceResponse(i.getId(), i.getAmount(), i.getCurrency(),
            i.getStatus(), i.getInvoiceUrl(), i.getPaidAt(), i.getCreatedAt());
    }
}
