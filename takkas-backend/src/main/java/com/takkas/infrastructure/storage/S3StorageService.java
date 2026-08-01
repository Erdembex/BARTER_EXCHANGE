package com.takkas.infrastructure.storage;

import com.takkas.common.exception.BusinessRuleException;
import com.takkas.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.InputStream;

@Service
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "s3")
@RequiredArgsConstructor
@Slf4j
public class S3StorageService implements StorageService {

    private final S3Client s3Client;

    @Value("${aws.s3.bucket}")
    private String bucket;

    @Override
    public void store(String key, InputStream content, String contentType, long contentLength) {
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(contentType)
                .contentLength(contentLength)
                .build();
            s3Client.putObject(request, RequestBody.fromInputStream(content, contentLength));
            log.debug("[S3] stored bucket={} key={}", bucket, key);
        } catch (S3Exception e) {
            log.error("[S3] upload failed key={}: {}", key, e.getMessage());
            throw new BusinessRuleException("Dosya yüklenemedi.");
        }
    }

    @Override
    public InputStream open(String key) {
        try {
            return s3Client.getObject(GetObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build());
        } catch (NoSuchKeyException e) {
            throw new ResourceNotFoundException("Dosya bulunamadı.");
        } catch (S3Exception e) {
            log.error("[S3] read failed key={}: {}", key, e.getMessage());
            throw new BusinessRuleException("Dosya okunamadı.");
        }
    }

    @Override
    public void delete(String key) {
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build());
        } catch (S3Exception e) {
            log.warn("[S3] delete failed key={}: {}", key, e.getMessage());
        }
    }

    @Override
    public boolean exists(String key) {
        try {
            s3Client.headObject(HeadObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .build());
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (S3Exception e) {
            log.warn("[S3] head failed key={}: {}", key, e.getMessage());
            return false;
        }
    }
}
