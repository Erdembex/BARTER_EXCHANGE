package com.takkas.infrastructure.storage;

import java.io.InputStream;

public interface StorageService {
    String upload(String key, InputStream content, String contentType);
    void delete(String key);
    String getUrl(String key);
}
