package com.takkas.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
@Slf4j
public class ProductionSecurityValidator implements ApplicationRunner {

    private static final String DEFAULT_JWT_SECRET = "change-me-in-production-min-32-chars!!";

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.admin.seed-enabled:false}")
    private boolean adminSeedEnabled;

    @Value("${springdoc.swagger-ui.enabled:false}")
    private boolean swaggerEnabled;

    @Override
    public void run(ApplicationArguments args) {
        if (DEFAULT_JWT_SECRET.equals(jwtSecret)) {
            throw new IllegalStateException(
                "Production ortamında JWT_SECRET varsayılan değerde olamaz.");
        }
        if (adminSeedEnabled) {
            log.warn("[ProductionSecurityValidator] Admin seed production'da açık — kapatmanız önerilir.");
        }
        if (swaggerEnabled) {
            log.warn("[ProductionSecurityValidator] Swagger production'da açık — kapatmanız önerilir.");
        }
    }
}
