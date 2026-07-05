package com.takkas.common.config;

import com.takkas.modules.user.domain.User;
import com.takkas.modules.user.domain.enums.UserStatus;
import com.takkas.modules.user.domain.enums.UserType;
import com.takkas.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminUserSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.seed-enabled:true}")
    private boolean seedEnabled;

    @Value("${app.admin.email:admin@bex.dev}")
    private String adminEmail;

    @Value("${app.admin.password:Admin123!}")
    private String adminPassword;

    @Override
    public void run(ApplicationArguments args) {
        if (!seedEnabled) return;

        userRepository.findByEmail(adminEmail).ifPresentOrElse(
            user -> {
                if (user.getUserType() != UserType.ADMIN) {
                    user.setUserType(UserType.ADMIN);
                    userRepository.save(user);
                    log.info("[AdminUserSeeder] Mevcut kullanıcı admin yapıldı: {}", adminEmail);
                }
            },
            () -> {
                userRepository.save(User.builder()
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .userType(UserType.ADMIN)
                    .status(UserStatus.ACTIVE)
                    .build());
                log.info("[AdminUserSeeder] Admin kullanıcı oluşturuldu: {}", adminEmail);
            }
        );
    }
}
