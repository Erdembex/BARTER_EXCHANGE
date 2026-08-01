package com.takkas.infrastructure.storage;

import java.io.InputStream;

public interface StorageService {

    /** Persist object at the given key (e.g. userId/filename.jpg). */
    void store(String key, InputStream content, String contentType, long contentLength);

    /** Open a stream for reading; caller must close. */
    InputStream open(String key);

    void delete(String key);

    boolean exists(String key);
}
