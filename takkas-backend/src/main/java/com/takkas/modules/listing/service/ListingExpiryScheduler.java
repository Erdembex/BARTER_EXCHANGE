package com.takkas.modules.listing.service;

import com.takkas.modules.listing.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
@RequiredArgsConstructor
@Slf4j
public class ListingExpiryScheduler {

    private final ListingRepository listingRepository;

    @Scheduled(cron = "0 0 2 * * *", zone = "Europe/Istanbul")
    @Transactional
    public void expireListings() {
        var expired = listingRepository.findExpiredActiveListings(Instant.now());
        expired.forEach(l -> { try { l.expire(); } catch (Exception e) {
            log.error("Listing expire error: id={}", l.getId()); }});
        log.info("[ListingExpiryScheduler] {} ilan süresi doldu.", expired.size());
    }
}
