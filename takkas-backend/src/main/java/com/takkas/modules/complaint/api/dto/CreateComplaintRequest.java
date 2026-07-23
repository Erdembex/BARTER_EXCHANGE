package com.takkas.modules.complaint.api.dto;

import com.takkas.modules.complaint.domain.enums.ComplaintReason;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateComplaintRequest(
    @NotNull UUID applicationId,
    @NotNull ComplaintReason reason,
    @NotBlank @Size(min = 10, max = 2000) String description) {}
