package com.takkas.modules.coupon.service;

import com.takkas.common.event.*;
import com.takkas.modules.coupon.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Component
@RequiredArgsConstructor
@Slf4j
public class CouponExpiryScheduler {

    private final CouponRepository couponRepository;
    private final DomainEventPublisher eventPublisher;
    private final RedisTemplate<String, String> redisTemplate;

    @Scheduled(cron = "0 0 1 * * *", zone = "Europe/Istanbul")
    @Transactional
    public void expireCoupons() {
        var expired = couponRepository.findExpiredActiveCoupons(Instant.now());
        expired.forEach(c -> { try { c.expire(); } catch (Exception e) {
            log.error("[CouponExpiryScheduler] id={} hata={}", c.getId(), e.getMessage()); }});
        log.info("[CouponExpiryScheduler] {} kupon süresi doldu.", expired.size());
    }

    @Scheduled(cron = "0 0 9 * * *", zone = "Europe/Istanbul")
    public void notifyExpiringSoon() {
        var now = Instant.now();
        var threshold = now.plus(3, ChronoUnit.DAYS);
        var expiring = couponRepository.findExpiringCoupons(now, threshold);
        expiring.forEach(c -> {
            String key = "coupon:%s:expiry_notified".formatted(c.getId());
            if (Boolean.TRUE.equals(redisTemplate.hasKey(key))) return;
            eventPublisher.publish(new CouponExpiringSoonEvent(c.getId(), c.getOwnerId(), c.getExpiresAt()));
            redisTemplate.opsForValue().set(key, "1", Duration.ofDays(4));
        });
        log.info("[CouponExpiryScheduler] {} kupon için EXPIRING_SOON gönderildi.", expiring.size());
    }
}
