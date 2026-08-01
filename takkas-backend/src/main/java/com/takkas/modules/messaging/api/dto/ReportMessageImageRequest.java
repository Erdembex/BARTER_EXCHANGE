package com.takkas.modules.messaging.api.dto;

import com.takkas.modules.messaging.domain.enums.MessageImageReportReason;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReportMessageImageRequest(
    @NotNull MessageImageReportReason reason,
    @NotBlank @Size(min = 10, max = 2000) String description) {}
