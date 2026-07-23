package com.takkas.modules.media.service;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MediaStorageService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        "image/jpeg", "image/png", "image/webp");
    private static final Set<String> BUSINESS_DOC_EXTENSIONS =
        Set.of(".jpg", ".jpeg", ".png", ".webp", ".pdf");
    private static final Set<String> BUSINESS_DOC_CONTENT_TYPES = Set.of(
        "image/jpeg", "image/png", "image/webp", "application/pdf");

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
                validateImage(file);
                String ext = extensionOf(file.getOriginalFilename(), file.getContentType());
                String filename = UUID.randomUUID() + ext;
                Path target = userDir.resolve(filename).normalize();
                if (!target.startsWith(userDir)) {
                    throw new BusinessRuleException("Geçersiz dosya yolu.");
                }
                file.transferTo(target);
                urls.add("/uploads/" + userId + "/" + filename);
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

    /** KYC evrakları — JPG, PNG, WEBP ve PDF */
    public List<String> storeBusinessFiles(UUID userId, MultipartFile[] files) {
        if (files == null || files.length == 0) {
            throw new BusinessRuleException("En az bir dosya seçmelisin.");
        }
        if (files.length > 3) {
            throw new BusinessRuleException("En fazla 3 evrak yüklenebilir.");
        }

        List<String> urls = new ArrayList<>();
        Path rootDir = Path.of(uploadDir).toAbsolutePath().normalize();
        Path userDir = rootDir.resolve(userId.toString());
        try {
            Files.createDirectories(userDir);
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) continue;
                validateBusinessDocument(file);
                String ext = businessExtensionOf(file.getOriginalFilename(), file.getContentType());
                String filename = UUID.randomUUID() + ext;
                Path target = userDir.resolve(filename).normalize();
                if (!target.startsWith(userDir)) {
                    throw new BusinessRuleException("Geçersiz dosya yolu.");
                }
                file.transferTo(target);
                urls.add("/uploads/" + userId + "/" + filename);
            }
        } catch (IOException e) {
            log.error("İşletme evrakı kaydedilemedi userId={}: {}", userId, e.getMessage());
            throw new BusinessRuleException("Dosya yüklenemedi.");
        }

        if (urls.isEmpty()) {
            throw new BusinessRuleException("Geçerli dosya bulunamadı.");
        }
        return urls;
    }

    public Resource loadAsResource(UUID ownerUserId, String filename) {
        Path file = resolveStoredFile(ownerUserId, filename);
        if (!Files.exists(file) || !Files.isRegularFile(file)) {
            throw new ResourceNotFoundException("Dosya bulunamadı.");
        }
        try {
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Dosya okunamadı.");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new BusinessRuleException("Dosya yolu geçersiz.");
        }
    }

    public MediaType probeMediaType(String filename) {
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".pdf")) return MediaType.APPLICATION_PDF;
        if (lower.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (lower.endsWith(".webp")) return MediaType.parseMediaType("image/webp");
        return MediaType.IMAGE_JPEG;
    }

    private Path resolveStoredFile(UUID ownerUserId, String filename) {
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new BusinessRuleException("Geçersiz dosya adı.");
        }
        Path rootDir = Path.of(uploadDir).toAbsolutePath().normalize();
        Path userDir = rootDir.resolve(ownerUserId.toString()).normalize();
        Path file = userDir.resolve(filename).normalize();
        if (!file.startsWith(userDir)) {
            throw new BusinessRuleException("Geçersiz dosya yolu.");
        }
        return file;
    }

    private void validateImage(MultipartFile file) {
        validateFile(file, ALLOWED_CONTENT_TYPES, ALLOWED_EXTENSIONS, "Yalnızca JPG, PNG veya WEBP yüklenebilir.");
    }

    private void validateBusinessDocument(MultipartFile file) {
        validateFile(file, BUSINESS_DOC_CONTENT_TYPES, BUSINESS_DOC_EXTENSIONS,
            "Yalnızca JPG, PNG, WEBP veya PDF yüklenebilir.");
    }

    private void validateFile(MultipartFile file, Set<String> allowedTypes, Set<String> allowedExts, String message) {
        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BusinessRuleException(message);
        }
        String ext = extensionOf(file.getOriginalFilename(), contentType, allowedExts).toLowerCase(Locale.ROOT);
        if (!allowedExts.contains(ext)) {
            throw new BusinessRuleException("Geçersiz dosya uzantısı.");
        }
    }

    private String extensionOf(String originalName, String contentType) {
        return extensionOf(originalName, contentType, ALLOWED_EXTENSIONS);
    }

    private String businessExtensionOf(String originalName, String contentType) {
        return extensionOf(originalName, contentType, BUSINESS_DOC_EXTENSIONS);
    }

    private String extensionOf(String originalName, String contentType, Set<String> allowedExts) {
        if (originalName != null && originalName.contains(".")) {
            String ext = originalName.substring(originalName.lastIndexOf('.')).toLowerCase(Locale.ROOT);
            if (allowedExts.contains(ext)) {
                return ext;
            }
        }
        if (contentType != null && contentType.contains("pdf")) return ".pdf";
        if (contentType != null && contentType.contains("png")) return ".png";
        if (contentType != null && contentType.contains("webp")) return ".webp";
        return ".jpg";
    }
}
