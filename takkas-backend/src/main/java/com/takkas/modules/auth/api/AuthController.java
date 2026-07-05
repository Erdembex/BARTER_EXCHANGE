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
    public AuthResponse refresh(@RequestBody RefreshTokenRequest req) {
        return tokenRefreshService.refresh(req.refreshToken());
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@CurrentUser UserPrincipal principal,
                       @RequestBody RefreshTokenRequest req) {
        refreshTokenRepository.findByToken(req.refreshToken())
            .ifPresent(rt -> rt.setRevoked(true));
    }
}
