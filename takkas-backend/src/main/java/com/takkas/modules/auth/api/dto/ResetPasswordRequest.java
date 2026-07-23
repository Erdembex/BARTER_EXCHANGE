package com.takkas.modules.auth.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
    @NotBlank @Size(min = 8, max = 64) String token,
    @NotBlank @Size(min = 8, max = 128)
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[A-Z]).{8,}$",
             message = "En az 8 karakter, 1 rakam, 1 büyük harf")
    String newPassword
) {}
