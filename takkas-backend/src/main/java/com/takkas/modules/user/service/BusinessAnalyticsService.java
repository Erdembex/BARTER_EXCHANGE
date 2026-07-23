package com.takkas.modules.user.service;

import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.coupon.domain.enums.CouponStatus;
import com.takkas.modules.coupon.repository.CouponRepository;
import com.takkas.modules.listing.domain.enums.ListingStatus;
import com.takkas.modules.listing.repository.ListingRepository;
import com.takkas.modules.user.api.dto.BusinessAnalyticsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BusinessAnalyticsService {

    private final ListingRepository listingRepository;
    private final ApplicationRepository applicationRepository;
    private final CouponRepository couponRepository;

    public BusinessAnalyticsResponse getSummary(UUID businessId) {
        var listings = listingRepository.findAllByBusinessIdOrderByCreatedAtDesc(businessId);
        var apps = applicationRepository.findAllByBusinessIdOrderByAppliedAtDesc(businessId);
        var coupons = couponRepository.findAllByBusinessIdOrderByCreatedAtDesc(businessId);

        int published = listings.size();
        int active = (int) listings.stream().filter(l -> l.getStatus() == ListingStatus.ACTIVE).count();
        int pendingApproval = (int) listings.stream().filter(l -> l.getStatus() == ListingStatus.DRAFT).count();
        int totalApps = apps.size();
        int pendingApps = (int) apps.stream().filter(a -> a.getStatus() == ApplicationStatus.PENDING).count();
        int submittedApps = (int) apps.stream().filter(a -> a.getStatus() == ApplicationStatus.SUBMITTED).count();
        int completed = (int) apps.stream().filter(a -> a.getStatus() == ApplicationStatus.REWARDED).count();
        int distributed = coupons.size();
        int used = (int) coupons.stream().filter(c -> c.getStatus() == CouponStatus.USED).count();
        int useRate = distributed > 0 ? Math.round((used * 100f) / distributed) : 0;

        return new BusinessAnalyticsResponse(
            published, active, pendingApproval, totalApps, pendingApps,
            submittedApps, completed, distributed, used, useRate);
    }
}
