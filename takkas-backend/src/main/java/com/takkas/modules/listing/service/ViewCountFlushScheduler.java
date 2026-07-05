package com.takkas.modules.listing.service;

import com.takkas.modules.listing.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class ViewCountFlushScheduler {

    private final ListingCacheService cacheService;
    private final ListingRepository listingRepository;

    @Scheduled(cron = "0 0 3 * * *", zone = "Europe/Istanbul")
    @Transactional
    public void flushViewCounts() {
        var pending = cacheService.getAllPendingViewCounts();
        pending.forEach((id, count) -> {
            try {
                listingRepository.incrementViewCount(id, count);
                cacheService.clearViewCount(id);
            } catch (Exception e) {
                log.error("[ViewCountFlush] listingId={} hata={}", id, e.getMessage());
            }
        });
        log.info("[ViewCountFlushScheduler] {} ilan flush edildi.", pending.size());
    }
}
