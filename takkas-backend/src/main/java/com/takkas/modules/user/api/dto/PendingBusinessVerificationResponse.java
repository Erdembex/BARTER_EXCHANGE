package com.takkas.modules.user.api.dto;

import com.takkas.modules.user.domain.enums.BusinessVerificationStatus;
import java.util.UUID;

public record PendingBusinessVerificationResponse(
    UUID profileId,
    UUID ownerUserId,
    String businessName,
    BusinessVerificationStatus verificationStatus,
    String verificationDocumentUrl,
    String verificationDocumentName
) {}
