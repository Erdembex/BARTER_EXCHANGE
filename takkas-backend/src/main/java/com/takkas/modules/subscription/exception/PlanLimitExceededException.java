package com.takkas.modules.subscription.exception;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.modules.subscription.domain.enums.FeatureKey;
import lombok.Getter;

@Getter
public class PlanLimitExceededException extends BusinessRuleException {
    private final FeatureKey featureKey;
    private final int limit;
    public PlanLimitExceededException(FeatureKey featureKey, int limit, String message) {
        super(message);
        this.featureKey = featureKey;
        this.limit = limit;
    }
}
