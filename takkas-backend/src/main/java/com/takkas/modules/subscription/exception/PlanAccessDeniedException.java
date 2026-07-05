package com.takkas.modules.subscription.exception;

import com.takkas.common.exception.ForbiddenException;
import com.takkas.modules.subscription.domain.enums.FeatureKey;
import lombok.Getter;

@Getter
public class PlanAccessDeniedException extends ForbiddenException {
    private final FeatureKey featureKey;
    public PlanAccessDeniedException(FeatureKey featureKey, String message) {
        super(message);
        this.featureKey = featureKey;
    }
}
