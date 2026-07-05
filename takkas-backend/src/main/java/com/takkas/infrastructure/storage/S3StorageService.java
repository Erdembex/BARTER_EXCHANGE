package com.takkas.infrastructure.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.InputStream;

/**
 * AWS S3 implementasyonu.
 * AWS SDK bağımlılığı eklendiğinde tam implementasyon yapılacak.
 * Şimdilik placeholder.
 */
@Service
@Slf4j
public class S3StorageService implements StorageService {

    @Value("${aws.s3.bucket:takkas-bucket}")
    private String bucket;

    @Value("${aws.s3.region:eu-central-1}")
    private String region;

    @Override
    public String upload(String key, InputStream content, String contentType) {
        log.info("[S3StorageService] Upload: bucket={} key={}", bucket, key);
        // TODO: AWS SDK ile implementasyon
        return "https://%s.s3.%s.amazonaws.com/%s".formatted(bucket, region, key);
    }

    @Override
    public void delete(String key) {
        log.info("[S3StorageService] Delete: key={}", key);
        // TODO: AWS SDK ile implementasyon
    }

    @Override
    public String getUrl(String key) {
        return "https://%s.s3.%s.amazonaws.com/%s".formatted(bucket, region, key);
    }
}
