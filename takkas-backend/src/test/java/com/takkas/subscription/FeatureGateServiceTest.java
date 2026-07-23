package com.takkas.subscription;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.takkas.modules.subscription.domain.BusinessSubscription;
import com.takkas.modules.subscription.domain.SubscriptionPlan;
import com.takkas.modules.subscription.domain.enums.FeatureKey;
import com.takkas.modules.subscription.domain.enums.SubscriptionStatus;
import com.takkas.modules.subscription.exception.PlanLimitExceededException;
import com.takkas.modules.subscription.repository.BusinessSubscriptionRepository;
import com.takkas.modules.subscription.repository.SubscriptionPlanRepository;
import com.takkas.modules.subscription.service.FeatureGateService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FeatureGateServiceTest {

    @Mock
    private BusinessSubscriptionRepository subscriptionRepository;
    @Mock
    private SubscriptionPlanRepository planRepository;
    @Mock
    private RedisTemplate<String, String> redisTemplate;
    @Mock
    private ValueOperations<String, String> valueOperations;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private BusinessSubscription subscription;
    @Mock
    private SubscriptionPlan plan;

    @InjectMocks
    private FeatureGateService featureGateService;

    private final UUID businessId = UUID.randomUUID();

    @Test
    void checkLimit_freeTierAtLimit_throwsPlanLimitExceeded() {
        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            featureGateService.checkLimit(businessId, FeatureKey.MAX_ACTIVE_LISTINGS, 1))
            .isInstanceOf(PlanLimitExceededException.class);
    }

    @Test
    void checkLimit_freeTierBelowLimit_allows() {
        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.empty());

        assertThatCode(() ->
            featureGateService.checkLimit(businessId, FeatureKey.MAX_ACTIVE_LISTINGS, 0))
            .doesNotThrowAnyException();
    }

    @Test
    void checkLimit_whenInvalidCachedValue_throwsInsteadOfBypassing() throws Exception {
        String cacheJson = "{\"MAX_ACTIVE_LISTINGS\":\"bad\"}";

        when(subscriptionRepository.findByBusinessId(businessId)).thenReturn(Optional.of(subscription));
        when(subscription.getStatus()).thenReturn(SubscriptionStatus.ACTIVE);
        when(subscription.getPlan()).thenReturn(plan);
        when(plan.getName()).thenReturn("STANDARD");
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.get("plan:features:STANDARD")).thenReturn(cacheJson);
        when(objectMapper.readValue(eq(cacheJson), eq(Map.class)))
            .thenReturn(Map.of("MAX_ACTIVE_LISTINGS", "bad"));

        assertThatThrownBy(() ->
            featureGateService.checkLimit(businessId, FeatureKey.MAX_ACTIVE_LISTINGS, 0))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Geçersiz plan limiti");
    }
}
