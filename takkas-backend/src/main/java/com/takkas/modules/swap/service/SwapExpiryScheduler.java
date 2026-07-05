package com.takkas.modules.swap.service;

import com.takkas.modules.swap.repository.SwapListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class SwapExpiryScheduler {

    private final SwapListingRepository swapListingRepository;

    @Scheduled(cron = "0 0 4 * * *", zone = "Europe/Istanbul")
    @Transactional
    public void expireSwapListings() {
        var expired = swapListingRepository.findExpiredOpenListings(Instant.now());
        expired.forEach(l -> { try { l.expire(); } catch (Exception e) {
            log.error("[SwapExpiryScheduler] id={} hata={}", l.getId(), e.getMessage()); }});
        log.info("[SwapExpiryScheduler] {} takas ilanının süresi doldu.", expired.size());
    }
}
