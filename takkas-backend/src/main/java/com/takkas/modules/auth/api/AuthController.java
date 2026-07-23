package com.takkas.modules.auth.api;

import com.takkas.common.security.CurrentUser;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.auth.api.dto.*;
import com.takkas.modules.auth.repository.RefreshTokenRepository;
import com.takkas.modules.auth.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Auth", description = "Kayıt, giriş, token yenileme")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final RegisterService registerService;
    private final LoginService loginService;
    private final TokenRefreshService tokenRefreshService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordService passwordService;
    private final PhoneVerificationService phoneVerificationService;

    @PostMapping("/register/business")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerBusiness(@Valid @RequestBody BusinessRegisterRequest req) {
        return registerService.registerBusiness(req);
    }

    @PostMapping("/register/individual")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registerIndividual(@Valid @RequestBody IndividualRegisterRequest req) {
        return registerService.registerIndividual(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return loginService.login(req);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest req) {
        return tokenRefreshService.refresh(req.refreshToken());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void logout(@CurrentUser UserPrincipal principal,
                       @Valid @RequestBody RefreshTokenRequest req) {
        refreshTokenRepository.findByToken(req.refreshToken())
            .ifPresent(rt -> {
                rt.setRevoked(true);
                refreshTokenRepository.save(rt);
            });
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        passwordService.requestPasswordReset(req);
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        passwordService.resetPassword(req);
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@CurrentUser UserPrincipal principal,
                               @Valid @RequestBody ChangePasswordRequest req) {
        passwordService.changePassword(principal.userId(), req);
    }

    @PostMapping("/phone/send-code")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sendPhoneCode(@CurrentUser UserPrincipal principal,
                              @Valid @RequestBody SendPhoneCodeRequest req) {
        phoneVerificationService.sendCode(principal.userId(), req);
    }

    @PostMapping("/phone/verify")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void verifyPhoneCode(@CurrentUser UserPrincipal principal,
                                @Valid @RequestBody VerifyPhoneCodeRequest req) {
        phoneVerificationService.verifyCode(principal.userId(), req);
    }
}
