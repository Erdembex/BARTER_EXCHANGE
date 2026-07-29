package com.takkas.modules.auth.api.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Şifre sıfırlama isteği yanıtı (dev ortamında kod dönebilir)")
public record ForgotPasswordResponse(
    @Schema(description = "Yalnızca yerel geliştirmede — e-posta gitmezse 8 haneli kod")
    String devResetToken
) {}
