package com.takkas.infrastructure.storage;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "local", matchIfMissing = true)
@Slf4j
public class LocalFileStorageService implements StorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void store(String key, InputStream content, String contentType, long contentLength) {
        Path target = resolveKey(key);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(content, target);
        } catch (IOException e) {
            log.error("Local store failed key={}: {}", key, e.getMessage());
            throw new BusinessRuleException("Dosya yüklenemedi.");
        }
    }

    @Override
    public InputStream open(String key) {
        Path file = resolveKey(key);
        if (!Files.exists(file) || !Files.isRegularFile(file)) {
            throw new ResourceNotFoundException("Dosya bulunamadı.");
        }
        try {
            return Files.newInputStream(file);
        } catch (IOException e) {
            throw new BusinessRuleException("Dosya okunamadı.");
        }
    }

    @Override
    public void delete(String key) {
        Path file = resolveKey(key);
        try {
            Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Local delete failed key={}: {}", key, e.getMessage());
        }
    }

    @Override
    public boolean exists(String key) {
        return Files.isRegularFile(resolveKey(key));
    }

    private Path resolveKey(String key) {
        if (key.contains("..") || key.startsWith("/") || key.startsWith("\\")) {
            throw new BusinessRuleException("Geçersiz dosya yolu.");
        }
        Path root = Path.of(uploadDir).toAbsolutePath().normalize();
        Path resolved = root.resolve(key).normalize();
        if (!resolved.startsWith(root)) {
            throw new BusinessRuleException("Geçersiz dosya yolu.");
        }
        return resolved;
    }
}
