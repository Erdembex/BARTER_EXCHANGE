package com.takkas.modules.media.api;

import com.takkas.common.security.CurrentUser;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.media.api.dto.UploadResponse;
import com.takkas.modules.media.service.MediaStorageService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Medya", description = "İşletme dosya yükleme")
@RestController
@RequestMapping("/api/business/uploads")
@RequiredArgsConstructor
public class BusinessMediaUploadController {

    private final MediaStorageService mediaStorageService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('BUSINESS')")
    public UploadResponse upload(@CurrentUser UserPrincipal principal,
                                 @RequestParam("files") MultipartFile[] files) {
        return new UploadResponse(mediaStorageService.storeBusinessFiles(principal.userId(), files));
    }
}
