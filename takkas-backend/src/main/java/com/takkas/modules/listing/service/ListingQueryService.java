package com.takkas.modules.listing.service;

import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.common.pagination.PageResponse;
import com.takkas.modules.complaint.domain.enums.ComplaintStatus;
import com.takkas.modules.complaint.repository.BusinessComplaintRepository;
import com.takkas.modules.complaint.service.TrustMetricsService;
import com.takkas.modules.listing.api.dto.*;
import com.takkas.modules.listing.domain.enums.ListingStatus;
import com.takkas.modules.listing.mapper.ListingMapper;
import com.takkas.modules.listing.repository.ListingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ListingQueryService {

    private final ListingRepository listingRepository;
    private final ListingCacheService cacheService;
    private final TrustMetricsService trustMetricsService;
    private final BusinessComplaintRepository businessComplaintRepository;

    public List<ListingCardResponse> getBusinessListings(UUID businessId) {
        return enrichCards(listingRepository.findAllByBusinessIdOrderByCreatedAtDesc(businessId)
            .stream().map(ListingMapper::toCardResponse).toList());
    }

    public PageResponse<ListingCardResponse> discover(ListingFilterRequest filter) {
        int size = filter.pageSize() != null ? filter.pageSize() : 20;
        Instant cursor = filter.cursor() != null ? filter.cursor() : Instant.now().plusSeconds(60);
        var listings = listingRepository.findActiveListingsForDiscover(
            filter.city(), filter.district(), filter.skills(),
            cursor, PageRequest.of(0, size));
        var cards = enrichCards(listings.stream().map(ListingMapper::toCardResponse).toList());
        var nextCursor = listings.isEmpty() ? null : listings.getLast().getCreatedAt();
        return PageResponse.of(cards, nextCursor);
    }

    public ListingResponse getDetail(UUID listingId, boolean incrementView) {
        var listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new ResourceNotFoundException("İlan bulunamadı."));
        if (listing.getStatus() == ListingStatus.DRAFT && !incrementView) {
            throw new ResourceNotFoundException("İlan bulunamadı.");
        }
        if (incrementView) cacheService.incrementViewCount(listingId);
        return ListingMapper.toResponse(listing);
    }

    private List<ListingCardResponse> enrichCards(List<ListingCardResponse> cards) {
        if (cards.isEmpty()) return cards;
        var businessIds = cards.stream()
            .map(ListingCardResponse::businessProfileId)
            .filter(id -> id != null)
            .collect(Collectors.toSet());
        Map<UUID, TrustMetricsService.TrustMetrics> metrics =
            trustMetricsService.batchForBusinesses(businessIds);

        return cards.stream().map(card -> {
            UUID bizId = card.businessProfileId();
            var trust = bizId != null ? metrics.get(bizId) : null;
            boolean listed = bizId != null && businessComplaintRepository
                .existsByBusinessProfileIdAndStatus(bizId, ComplaintStatus.APPROVED);
            return new ListingCardResponse(
                card.id(),
                card.businessProfileId(),
                card.businessName(),
                card.businessLogoUrl(),
                card.businessCategory(),
                card.title(),
                card.skills(),
                card.rewardType(),
                card.rewardQuantity(),
                card.rewardUnit(),
                card.rewardDescription(),
                card.status(),
                card.applicantCount(),
                card.createdAt(),
                listed,
                trust != null && trust.isDangerous());
        }).toList();
    }
}
