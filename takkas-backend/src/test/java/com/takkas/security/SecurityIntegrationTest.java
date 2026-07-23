package com.takkas.security;

import com.takkas.modules.user.domain.enums.UserStatus;
import com.takkas.modules.user.repository.UserRepository;
import com.takkas.support.AbstractIntegrationTest;
import com.takkas.support.RequiresIntegrationInfrastructure;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.UUID;

@RequiresIntegrationInfrastructure
class SecurityIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void suspendedUserToken_isRejectedOnProtectedEndpoint() {
        var registered = api().registerIndividualTracked("sec-susp");

        userRepository.findByEmail(registered.email()).ifPresent(user -> {
            user.setStatus(UserStatus.SUSPENDED);
            userRepository.saveAndFlush(user);
        });

        webTestClient.get()
            .uri("/api/individual/applications")
            .headers(h -> h.setBearerAuth(registered.auth().accessToken()))
            .exchange()
            .expectStatus().isForbidden();
    }

    @Test
    void uploadDownload_withoutToken_returns401() {
        webTestClient.get()
            .uri("/uploads/{owner}/{file}", UUID.randomUUID(), "photo.jpg")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    void uploadDownload_otherUsersFile_returns403() {
        var owner = api().registerIndividualTracked("sec-owner");
        var stranger = api().registerIndividualTracked("sec-stranger");
        UUID ownerUserId = userRepository.findByEmail(owner.email()).orElseThrow().getId();

        webTestClient.get()
            .uri("/uploads/{owner}/{file}", ownerUserId, "missing.jpg")
            .headers(h -> h.setBearerAuth(stranger.auth().accessToken()))
            .exchange()
            .expectStatus().isForbidden();
    }
}
