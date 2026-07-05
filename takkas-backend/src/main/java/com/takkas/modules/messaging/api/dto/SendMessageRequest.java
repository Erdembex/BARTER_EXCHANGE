package com.takkas.modules.messaging.api.dto;
import jakarta.validation.constraints.*;
public record SendMessageRequest(@NotBlank @Size(max = 1000) String content) {}
