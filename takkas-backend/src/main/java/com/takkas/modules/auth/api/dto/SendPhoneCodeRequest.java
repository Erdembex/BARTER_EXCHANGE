package com.takkas.modules.auth.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SendPhoneCodeRequest(
    @NotBlank
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Geçerli bir telefon numarası gir.")
    String phone
) {}
