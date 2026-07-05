package com.takkas.modules.listing.service;

import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.common.pagination.PageResponse;
import com.takkas.modules.listing.api.dto.*;
import com.takkas.modules.listing.mapper.ListingMapper;
import com.takkas.modules.listing.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ListingQueryService {

    private final ListingRepository listingRepository;
    private final ListingCacheService cacheService;

    public List<ListingCardResponse> getBusinessListings(UUID businessId) {
        return listingRepository.findAllByBusinessIdOrderByCreatedAtDesc(businessId)
            .stream().map(ListingMapper::toCardResponse).toList();
    }

    public PageResponse<ListingCardResponse> discover(ListingFilterRequest filter) {
        int size = filter.pageSize() != null ? filter.pageSize() : 20;
        Instant cursor = filter.cursor() != null ? filter.cursor() : Instant.now().plusSeconds(60);
        var listings = listingRepository.findActiveListingsForDiscover(
            filter.city(), filter.district(), filter.skills(),
            cursor, PageRequest.of(0, size));
        var cards = listings.stream().map(ListingMapper::toCardResponse).toList();
        var nextCursor = listings.isEmpty() ? null : listings.getLast().getCreatedAt();
        return PageResponse.of(cards, nextCursor);
    }

    public ListingResponse getDetail(UUID listingId, boolean incrementView) {
        var listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new ResourceNotFoundException("İlan bulunamadı."));
        if (incrementView) cacheService.incrementViewCount(listingId);
        return ListingMapper.toResponse(listing);
    }
}
