package com.takkas.modules.media.api;

import com.takkas.common.security.CurrentUser;
import com.takkas.common.security.UserPrincipal;
import com.takkas.modules.media.service.MediaStorageService;
import com.takkas.modules.media.service.UploadAccessService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class MediaDownloadController {

    private final MediaStorageService mediaStorageService;
    private final UploadAccessService uploadAccessService;

    @GetMapping("/uploads/{ownerUserId}/{filename}")
    public ResponseEntity<Resource> download(@CurrentUser UserPrincipal principal,
                                             @PathVariable UUID ownerUserId,
                                             @PathVariable String filename) {
        uploadAccessService.verifyAccess(principal, ownerUserId, filename);
        Resource resource = mediaStorageService.loadAsResource(ownerUserId, filename);
        MediaType mediaType = mediaStorageService.probeMediaType(filename);
        return ResponseEntity.ok()
            .contentType(mediaType)
            .body(resource);
    }
}
