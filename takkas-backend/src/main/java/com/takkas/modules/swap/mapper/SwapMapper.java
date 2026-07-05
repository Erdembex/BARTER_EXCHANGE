package com.takkas.modules.swap.mapper;

import com.takkas.modules.coupon.CouponFacade;
import com.takkas.modules.swap.api.dto.*;
import com.takkas.modules.swap.domain.*;

public class SwapMapper {

    public static SwapListingResponse toListingResponse(SwapListing l, CouponFacade.CouponInfo coupon) {
        return new SwapListingResponse(l.getId(), l.getOwnerId(), l.getOfferedCouponId(),
            l.getWantedRewardType(), l.getWantedQuantity(), l.getWantedDescription(),
            l.getStatus(), l.getCreatedAt(), l.getExpiresAt());
    }

    public static SwapListingCardResponse toCardResponse(SwapListing l, CouponFacade.CouponInfo c) {
        return new SwapListingCardResponse(l.getId(), l.getOwnerId(),
            c != null ? c.rewardType() : null,
            c != null ? c.quantity() : null,
            c != null ? c.unit() : null,
            c != null ? c.description() : null,
            c != null ? c.expiresAt() : null,
            l.getWantedRewardType(), l.getWantedQuantity(), l.getWantedDescription(),
            l.getStatus(), l.getCreatedAt(), l.getExpiresAt());
    }

    public static SwapOfferResponse toOfferResponse(SwapOffer o, CouponFacade.CouponInfo c) {
        return new SwapOfferResponse(o.getId(), o.getSwapListing().getId(),
            o.getOffererId(), o.getOfferedCouponId(), o.getMessage(),
            o.getStatus(), o.getCreatedAt());
    }

    public static SwapTradeResponse toTradeResponse(SwapTrade t) {
        return new SwapTradeResponse(t.getId(), t.getSwapListing().getId(),
            t.getSwapOffer().getId(), t.getInitiatorCouponId(), t.getReceiverCouponId(),
            t.getInitiatorNewOwnerId(), t.getReceiverNewOwnerId(), t.getCompletedAt());
    }
}
