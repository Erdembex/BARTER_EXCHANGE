package com.takkas.modules.user.api.dto;
import com.takkas.modules.user.domain.enums.BusinessCategory;
import java.util.UUID;
public record BusinessProfileResponse(
    UUID id, String businessName, BusinessCategory category,
    String city, String district, String phone, String logoUrl,
    String bio, boolean verified) {}
