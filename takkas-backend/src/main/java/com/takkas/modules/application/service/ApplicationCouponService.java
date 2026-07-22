package com.takkas.modules.application.service;

import com.takkas.common.event.CouponIssuedEvent;
import com.takkas.common.event.DomainEventPublisher;
import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ForbiddenException;
import com.takkas.common.exception.ResourceNotFoundException;
import com.takkas.modules.application.domain.Application;
import com.takkas.modules.application.domain.enums.ApplicationStatus;
import com.takkas.modules.application.repository.ApplicationRepository;
import com.takkas.modules.coupon.api.dto.CouponResponse;
import com.takkas.modules.coupon.domain.Coupon;
import com.takkas.modules.coupon.domain.enums.CouponStatus;
import com.takkas.modules.coupon.mapper.CouponMapper;
import com.takkas.modules.coupon.repository.CouponRepository;
import com.takkas.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApplicationCouponService {

    private final ApplicationRepository applicationRepository;
    private final CouponRepository couponRepository;
    private final UserRepository userRepository;
    private final DomainEventPublisher eventPublisher;

    @Transactional
    public CouponResponse issueCoupon(UUID businessProfileId, UUID applicationId, String note) {
        Application app = applicationRepository.findById(applicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Başvuru bulunamadı."));
        if (!app.getBusinessId().equals(businessProfileId)) {
            throw new ForbiddenException("Bu başvuruya erişim yetkiniz yok.");
        }
        if (app.getStatus() != ApplicationStatus.SUBMISSION_APPROVED) {
            throw new BusinessRuleException("Kupon yalnızca admin onaylı teslimler için verilebilir.");
        }

        Coupon coupon = couponRepository.findByApplicationId(applicationId)
            .orElseThrow(() -> new BusinessRuleException("Bu başvuru için kupon bulunamadı."));

        if (coupon.getStatus() == CouponStatus.ACTIVE) {
            return CouponMapper.toResponse(coupon);
        }
        if (coupon.getStatus() != CouponStatus.DRAFT) {
            throw new BusinessRuleException("Kupon zaten işlenmiş.");
        }

        if (note != null && !note.isBlank()) {
            app.setReviewNote(note.trim());
        }

        coupon.activate();
        couponRepository.save(coupon);

        app.setStatus(ApplicationStatus.REWARDED);
        applicationRepository.save(app);

        UUID individualUserId = userRepository.findUserIdByIndividualProfileId(app.getIndividual().getId());
        eventPublisher.publish(new CouponIssuedEvent(
            coupon.getId(),
            coupon.getOwnerId(),
            individualUserId,
            coupon.getBusinessId(),
            coupon.getRewardType(),
            coupon.getQuantity(),
            coupon.getUnit(),
            coupon.getExpiresAt()
        ));

        return CouponMapper.toResponse(coupon);
    }
}
