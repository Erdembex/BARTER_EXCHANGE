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
import com.takkas.modules.messaging.domain.Conversation;
import com.takkas.modules.messaging.repository.ConversationRepository;
import com.takkas.modules.messaging.service.MessageService;
import com.takkas.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApplicationCouponService {

    private static final String BUSINESS_THANK_YOU_MESSAGE =
        "Paraya gerek yok, demiştik :) Umarım memnun kalmışsınızdır!";
    private static final String INDIVIDUAL_SWAP_TIP_MESSAGE =
        "Bu kuponu takas pazarında takas edebileceğini biliyor muydun? Kazandığın kuponları "
            + "kullanmak zorunda değilsin; farklı kuponlarla takas edebilirsin.";

    private final ApplicationRepository applicationRepository;
    private final CouponRepository couponRepository;
    private final UserRepository userRepository;
    private final DomainEventPublisher eventPublisher;
    private final ConversationRepository conversationRepository;
    private final MessageService messageService;

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
        sendCompletionSystemMessages(applicationId, individualUserId);

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

    /** Kupon verildiğinde her iki tarafa da sohbette kendine özel bir kapanış mesajı gösterilir. */
    private void sendCompletionSystemMessages(UUID applicationId, UUID individualUserId) {
        Conversation conv = conversationRepository.findByApplicationId(applicationId).orElse(null);
        if (conv == null) return;

        messageService.sendSystemMessage(conv.getId(), conv.getBusinessUserId(), BUSINESS_THANK_YOU_MESSAGE);
        messageService.sendSystemMessage(conv.getId(), individualUserId, INDIVIDUAL_SWAP_TIP_MESSAGE);
    }
}
