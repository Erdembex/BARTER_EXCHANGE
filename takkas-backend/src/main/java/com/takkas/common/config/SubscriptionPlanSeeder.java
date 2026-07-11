package com.takkas.common.config;

import com.takkas.modules.subscription.domain.PlanFeature;
import com.takkas.modules.subscription.domain.SubscriptionPlan;
import com.takkas.modules.subscription.repository.SubscriptionPlanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(1)
public class SubscriptionPlanSeeder implements ApplicationRunner {

    private final SubscriptionPlanRepository planRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedPlan("FREE", "Ücretsiz", BigDecimal.ZERO, BigDecimal.ZERO, List.of(
            feature("MAX_ACTIVE_LISTINGS",          "2"),
            feature("MAX_UNDER_REVIEW_PER_LISTING", "3"),
            feature("CAN_FEATURE_LISTING",          "false"),
            feature("CAN_SEE_APPLICANT_CONTACTS",   "false"),
            feature("SWAP_MARKET_ACCESS",           "false"),
            feature("ANALYTICS_ACCESS",             "false"),
            feature("PRIORITY_SUPPORT",             "false")
        ));

        seedPlan("STANDARD", "Standart", new BigDecimal("299.00"), new BigDecimal("2990.00"), List.of(
            feature("MAX_ACTIVE_LISTINGS",          "10"),
            feature("MAX_UNDER_REVIEW_PER_LISTING", "10"),
            feature("CAN_FEATURE_LISTING",          "false"),
            feature("CAN_SEE_APPLICANT_CONTACTS",   "true"),
            feature("SWAP_MARKET_ACCESS",           "true"),
            feature("ANALYTICS_ACCESS",             "false"),
            feature("PRIORITY_SUPPORT",             "false")
        ));

        seedPlan("PRO", "Pro", new BigDecimal("699.00"), new BigDecimal("6990.00"), List.of(
            feature("MAX_ACTIVE_LISTINGS",          "unlimited"),
            feature("MAX_UNDER_REVIEW_PER_LISTING", "unlimited"),
            feature("CAN_FEATURE_LISTING",          "true"),
            feature("CAN_SEE_APPLICANT_CONTACTS",   "true"),
            feature("SWAP_MARKET_ACCESS",           "true"),
            feature("ANALYTICS_ACCESS",             "true"),
            feature("PRIORITY_SUPPORT",             "true")
        ));
    }

    private void seedPlan(String name, String displayName,
                          BigDecimal priceMonthly, BigDecimal priceYearly,
                          List<PlanFeature> features) {
        if (planRepository.findByName(name).isPresent()) {
            log.debug("[SubscriptionPlanSeeder] Plan zaten mevcut: {}", name);
            return;
        }
        SubscriptionPlan plan = SubscriptionPlan.builder()
            .name(name)
            .displayName(displayName)
            .priceMonthly(priceMonthly)
            .priceYearly(priceYearly)
            .isActive(true)
            .build();
        features.forEach(f -> {
            f.setPlan(plan);
            plan.getFeatures().add(f);
        });
        planRepository.save(plan);
        log.info("[SubscriptionPlanSeeder] Plan oluşturuldu: {}", name);
    }

    private PlanFeature feature(String key, String value) {
        return PlanFeature.builder().featureKey(key).featureValue(value).build();
    }
}
