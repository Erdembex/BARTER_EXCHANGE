package com.takkas.modules.admin.api;

import com.takkas.modules.admin.service.AdminListingService;
import com.takkas.modules.listing.api.dto.ListingCardResponse;
import com.takkas.modules.listing.api.dto.ListingResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Admin", description = "Görev moderasyonu")
@RestController
@RequestMapping("/api/admin/listings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminListingController {

    private final AdminListingService adminListingService;

    @GetMapping("/pending")
    public List<ListingCardResponse> getPending() {
        return adminListingService.getPendingListings();
    }

    @PatchMapping("/{id}/approve")
    public ListingResponse approve(@PathVariable UUID id) {
        return adminListingService.approveListing(id);
    }

    @PatchMapping("/{id}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@PathVariable UUID id) {
        adminListingService.rejectListing(id);
    }
}
