package com.takkas.modules.subscription.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.takkas.common.exception.*;
import com.takkas.modules.subscription.domain.*;
import com.takkas.modules.subscription.domain.enums.*;
import com.takkas.modules.subscription.exception.*;
import com.takkas.modules.subscription.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeatureGateService {

    private final BusinessSubscriptionRepository subscriptionRepository;
    private final SubscriptionPlanRepository planRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String PLAN_CACHE_KEY = "plan:features:%s";
    private static final Duration CACHE_TTL = Duration.ofHours(6);

    public void checkLimit(UUID businessId, FeatureKey featureKey, int currentCount) {
        String value = getFeatureValue(businessId, featureKey);
        if ("unlimited".equalsIgnoreCase(value)) return;
        try {
            int limit = Integer.parseInt(value);
            if (currentCount >= limit)
                throw new PlanLimitExceededException(featureKey, limit,
                    "Plan limitinize ulaştınız. Daha fazlası için planınızı yükseltin.");
        } catch (NumberFormatException e) {
            log.error("[FeatureGateService] Geçersiz limit: key={} value={}", featureKey, value);
        }
    }

    public void requireAccess(UUID businessId, FeatureKey featureKey) {
        if (!hasAccess(businessId, featureKey))
            throw new PlanAccessDeniedException(featureKey,
                "Bu özellik mevcut planınızda bulunmuyor.");
    }

    public boolean hasAccess(UUID businessId, FeatureKey featureKey) {
        return Boolean.parseBoolean(getFeatureValue(businessId, featureKey));
    }

    public void requireActiveSubscription(UUID businessId) {
        var sub = subscriptionRepository.findByBusinessId(businessId)
            .orElseThrow(() -> new ResourceNotFoundException("Abonelik bulunamadı."));
        if (sub.getStatus() == SubscriptionStatus.PAST_DUE && sub.isGracePeriodExpired())
            throw new BusinessRuleException("Ödeme sorununuz nedeniyle hesabınız kısıtlandı.");
        if (sub.getStatus() == SubscriptionStatus.CANCELLED)
            throw new BusinessRuleException("Aboneliğiniz iptal edilmiş.");
    }

    public void evictPlanCache(String planName) {
        redisTemplate.delete(PLAN_CACHE_KEY.formatted(planName));
    }

    private String getFeatureValue(UUID businessId, FeatureKey featureKey) {
        var subOpt = subscriptionRepository.findByBusinessId(businessId);
        if (subOpt.isEmpty()) {
            // Abonelik atanmamış işletmeler için varsayılan ücretsiz katman limitleri.
            // Tüm özellikler kısıtlı; plan satın alınmadan erişim sağlanamaz.
            log.debug("[FeatureGateService] Abonelik bulunamadı, ücretsiz katman limitleri uygulanıyor: businessId={} key={}", businessId, featureKey);
            return getFreeTierValue(featureKey);
        }
        var sub = subOpt.get();
        // İptal edilmiş veya süresi geçmiş abonelikler için ücretsiz katman
        if (sub.getStatus() == SubscriptionStatus.CANCELLED) {
            return getFreeTierValue(featureKey);
        }
        String planName = sub.getPlan().getName();
        Map<String, String> cached = getCachedFeatures(planName);
        if (cached != null) return cached.getOrDefault(featureKey.name(), "false");
        return loadAndCacheFeatures(planName).getOrDefault(featureKey.name(), "false");
    }

    /**
     * Ücretsiz katman (aboneliksiz) için varsayılan feature değerleri.
     * İşletmeler temel özelliklere sahipken premium özellikler kısıtlıdır.
     */
    private String getFreeTierValue(FeatureKey featureKey) {
        return switch (featureKey) {
            case MAX_ACTIVE_LISTINGS         -> "1";
            case MAX_UNDER_REVIEW_PER_LISTING -> "3";
            case CAN_FEATURE_LISTING         -> "false";
            case CAN_SEE_APPLICANT_CONTACTS  -> "false";
            case SWAP_MARKET_ACCESS          -> "false";
            case ANALYTICS_ACCESS            -> "false";
            case PRIORITY_SUPPORT            -> "false";
        };
    }

    @SuppressWarnings("unchecked")
    private Map<String, String> getCachedFeatures(String planName) {
        String raw = redisTemplate.opsForValue().get(PLAN_CACHE_KEY.formatted(planName));
        if (raw == null) return null;
        try { return objectMapper.readValue(raw, Map.class); }
        catch (JsonProcessingException e) { return null; }
    }

    private Map<String, String> loadAndCacheFeatures(String planName) {
        var plan = planRepository.findByName(planName)
            .orElseThrow(() -> new ResourceNotFoundException("Plan bulunamadı: " + planName));
        Map<String, String> features = plan.getFeatures().stream()
            .collect(Collectors.toMap(PlanFeature::getFeatureKey, PlanFeature::getFeatureValue));
        try {
            redisTemplate.opsForValue().set(
                PLAN_CACHE_KEY.formatted(planName),
                objectMapper.writeValueAsString(features), CACHE_TTL);
        } catch (JsonProcessingException e) {
            log.error("[FeatureGateService] Cache yazma hatası: {}", e.getMessage());
        }
        return features;
    }
}
