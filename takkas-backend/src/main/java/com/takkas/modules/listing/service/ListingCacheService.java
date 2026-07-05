package com.takkas.modules.listing.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ListingCacheService {

    private final RedisTemplate<String, String> redisTemplate;
    private static final String VIEW_KEY = "listing:%s:views";

    public void incrementViewCount(UUID listingId) {
        redisTemplate.opsForValue().increment(VIEW_KEY.formatted(listingId));
    }

    public Optional<Integer> getViewCount(UUID listingId) {
        String val = redisTemplate.opsForValue().get(VIEW_KEY.formatted(listingId));
        return Optional.ofNullable(val).map(Integer::parseInt);
    }

    public Map<UUID, Integer> getAllPendingViewCounts() {
        Set<String> keys = redisTemplate.keys("listing:*:views");
        if (keys == null || keys.isEmpty()) return Map.of();
        Map<UUID, Integer> result = new HashMap<>();
        keys.forEach(k -> {
            String val = redisTemplate.opsForValue().get(k);
            if (val != null) result.put(UUID.fromString(k.split(":")[1]), Integer.parseInt(val));
        });
        return result;
    }

    public void clearViewCount(UUID listingId) {
        redisTemplate.delete(VIEW_KEY.formatted(listingId));
    }
}
