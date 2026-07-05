package com.takkas.infrastructure.push;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;

@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${firebase.service-account-path:#{null}}")
    private String serviceAccountPath;

    @Bean
    public FirebaseApp firebaseApp() {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }
        try {
            FirebaseOptions options;
            if (serviceAccountPath != null) {
                options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(
                        new FileInputStream(serviceAccountPath)))
                    .build();
            } else {
                options = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.getApplicationDefault())
                    .build();
            }
            return FirebaseApp.initializeApp(options);
        } catch (IOException e) {
            log.warn("Firebase credentials bulunamadı, push bildirimleri devre dışı: {}", e.getMessage());
            return null;
        }
    }
}
