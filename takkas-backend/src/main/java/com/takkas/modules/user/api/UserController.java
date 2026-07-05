package com.takkas.modules.user.api;

import com.takkas.common.security.CurrentUser;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.user.api.dto.*;
import com.takkas.modules.user.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Kullanıcı Profil", description = "İşletme ve bireysel profil yönetimi")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/business/profile")
    public BusinessProfileResponse getBusinessProfile(@CurrentUser UserPrincipal p) {
        return userService.getBusinessProfile(p.profileId());
    }

    @PatchMapping("/business/profile")
    public BusinessProfileResponse updateBusinessProfile(@CurrentUser UserPrincipal p,
                                                         @Valid @RequestBody UpdateBusinessProfileRequest req) {
        return userService.updateBusinessProfile(p.profileId(), req);
    }

    @GetMapping("/individual/profile")
    public IndividualProfileResponse getIndividualProfile(@CurrentUser UserPrincipal p) {
        return userService.getIndividualProfile(p.profileId());
    }

    @PatchMapping("/individual/profile")
    public IndividualProfileResponse updateIndividualProfile(@CurrentUser UserPrincipal p,
                                                              @Valid @RequestBody UpdateIndividualProfileRequest req) {
        return userService.updateIndividualProfile(p.profileId(), req);
    }
}
