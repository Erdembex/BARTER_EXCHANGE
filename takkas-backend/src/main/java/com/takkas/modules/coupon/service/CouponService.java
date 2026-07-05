package com.takkas.modules.coupon.service;

import com.takkas.common.exception.*;
import com.takkas.modules.coupon.api.dto.*;
import com.takkas.modules.coupon.domain.enums.CouponStatus;
import com.takkas.modules.coupon.mapper.CouponMapper;
import com.takkas.modules.coupon.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    public List<CouponResponse> getMyCoupons(UUID ownerId, CouponStatus status) {
        var coupons = status != null
            ? couponRepository.findAllByOwnerIdAndStatusOrderByCreatedAtDesc(ownerId, status)
            : couponRepository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId);
        return coupons.stream().map(CouponMapper::toResponse).toList();
    }

    public CouponResponse getDetail(UUID couponId, UUID ownerId) {
        var c = couponRepository.findById(couponId)
            .orElseThrow(() -> new ResourceNotFoundException("Kupon bulunamadı."));
        if (!c.getOwnerId().equals(ownerId))
            throw new ForbiddenException("Bu kupona erişim yetkiniz yok.");
        return CouponMapper.toResponse(c);
    }

    public CouponQrResponse getQrCode(UUID couponId, UUID ownerId) {
        var c = couponRepository.findById(couponId)
            .orElseThrow(() -> new ResourceNotFoundException("Kupon bulunamadı."));
        if (!c.getOwnerId().equals(ownerId))
            throw new ForbiddenException("Bu kupona erişim yetkiniz yok.");
        if (!c.isActive())
            throw new BusinessRuleException("Kupon aktif değil veya süresi dolmuş.");
        return new CouponQrResponse(c.getId(), c.getQrToken(), c.getRewardType(),
            c.getQuantity(), c.getUnit(), c.getDescription(), c.getExpiresAt());
    }

    public List<CouponResponse> getIssuedCoupons(UUID businessId, CouponStatus status) {
        var coupons = couponRepository.findAllByBusinessIdAndStatus(
            businessId, status != null ? status : CouponStatus.ACTIVE);
        return coupons.stream().map(CouponMapper::toResponse).toList();
    }
}
