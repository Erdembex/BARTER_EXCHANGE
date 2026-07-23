package com.takkas.modules.admin.api;

import com.takkas.modules.admin.api.dto.AdminUserSummaryResponse;
import com.takkas.modules.admin.service.AdminUserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Admin Kullanıcılar", description = "Kullanıcı arama ve askıya alma")
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public List<AdminUserSummaryResponse> search(@RequestParam(required = false) String q) {
        return adminUserService.searchUsers(q);
    }

    @PatchMapping("/{userId}/suspend")
    public AdminUserSummaryResponse suspend(@PathVariable UUID userId,
                                            @RequestParam(defaultValue = "true") boolean suspended) {
        return adminUserService.setSuspended(userId, suspended);
    }
}
