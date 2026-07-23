package com.takkas.modules.auth.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record VerifyPhoneCodeRequest(
    @NotBlank
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "Geçerli bir telefon numarası gir.")
    String phone,
    @NotBlank
    @Size(min = 6, max = 6)
    String code
) {}
