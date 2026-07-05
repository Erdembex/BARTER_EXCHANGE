package com.takkas.modules.media.service;

import com.takkas.common.exception.BusinessRuleException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaStorageService {

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public List<String> storeUserFiles(UUID userId, MultipartFile[] files) {
        if (files == null || files.length == 0) {
            throw new BusinessRuleException("En az bir dosya seçmelisin.");
        }
        if (files.length > 5) {
            throw new BusinessRuleException("En fazla 5 dosya yüklenebilir.");
        }

        List<String> urls = new ArrayList<>();
        Path rootDir = Path.of(uploadDir).toAbsolutePath().normalize();
        Path userDir = rootDir.resolve(userId.toString());
        try {
            Files.createDirectories(userDir);
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;
                String ext = extensionOf(file.getOriginalFilename(), file.getContentType());
                String filename = UUID.randomUUID() + ext;
                Path target = userDir.resolve(filename).normalize();
                if (!target.startsWith(userDir)) {
                    throw new BusinessRuleException("Geçersiz dosya yolu.");
                }
                file.transferTo(target);
                urls.add(baseUrl + "/uploads/" + userId + "/" + filename);
            }
        } catch (IOException e) {
            log.error("Dosya kaydedilemedi userId={} dir={}: {}", userId, userDir, e.getMessage());
            throw new BusinessRuleException("Dosya yüklenemedi.");
        }

        if (urls.isEmpty()) {
            throw new BusinessRuleException("Geçerli dosya bulunamadı.");
        }
        return urls;
    }

    private String extensionOf(String originalName, String contentType) {
        if (originalName != null && originalName.contains(".")) {
            return originalName.substring(originalName.lastIndexOf('.'));
        }
        if (contentType != null && contentType.contains("png")) return ".png";
        if (contentType != null && contentType.contains("webp")) return ".webp";
        return ".jpg";
    }
}
