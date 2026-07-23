package com.takkas.complaint;

import com.takkas.modules.auth.api.dto.AuthResponse;
import com.takkas.modules.application.api.dto.ApplicationResponse;
import com.takkas.modules.listing.api.dto.ListingResponse;
import com.takkas.support.AbstractIntegrationTest;
import com.takkas.support.RequiresIntegrationInfrastructure;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import java.util.UUID;

@RequiresIntegrationInfrastructure
class ComplaintIntegrationTest extends AbstractIntegrationTest {

    @Test
    void pendingApplication_isNotEligibleForComplaint() {
        AuthResponse business = api().registerBusiness("c-pending-biz");
        AuthResponse individual = api().registerIndividual("c-pending-user");
        AuthResponse admin = api().loginAdmin();

        ListingResponse listing = api().createListing(business.accessToken());
        api().approveListing(admin.accessToken(), listing.id());
        api().apply(individual.accessToken(), listing.id());

        webTestClient.get()
            .uri("/api/individual/complaints/eligible-applications")
            .headers(h -> h.setBearerAuth(individual.accessToken()))
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$").isArray()
            .jsonPath("$.length()").isEqualTo(0);
    }

    @Test
    void acceptedApplication_allowsComplaintSubmission() {
        AuthResponse business = api().registerBusiness("c-accept-biz");
        AuthResponse individual = api().registerIndividual("c-accept-user");
        AuthResponse admin = api().loginAdmin();

        ListingResponse listing = api().createListing(business.accessToken());
        api().approveListing(admin.accessToken(), listing.id());
        ApplicationResponse application = api().apply(individual.accessToken(), listing.id());
        api().acceptApplication(business.accessToken(), application.applicationId());

        webTestClient.get()
            .uri("/api/individual/complaints/eligible-applications")
            .headers(h -> h.setBearerAuth(individual.accessToken()))
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.length()").isEqualTo(1)
            .jsonPath("$[0].applicationId").isEqualTo(application.applicationId().toString());

        api().submitComplaint(individual.accessToken(), application.applicationId());

        webTestClient.get()
            .uri("/api/individual/complaints/mine")
            .headers(h -> h.setBearerAuth(individual.accessToken()))
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.length()").isEqualTo(1)
            .jsonPath("$[0].status").isEqualTo("PENDING");
    }

    @Test
    void duplicateComplaintForSameApplication_returns422() {
        AuthResponse business = api().registerBusiness("c-dup-biz");
        AuthResponse individual = api().registerIndividual("c-dup-user");
        AuthResponse admin = api().loginAdmin();

        ListingResponse listing = api().createListing(business.accessToken());
        api().approveListing(admin.accessToken(), listing.id());
        ApplicationResponse application = api().apply(individual.accessToken(), listing.id());
        api().acceptApplication(business.accessToken(), application.applicationId());

        api().submitComplaint(individual.accessToken(), application.applicationId());

        webTestClient.post()
            .uri("/api/individual/complaints")
            .headers(h -> h.setBearerAuth(individual.accessToken()))
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "applicationId": "%s",
                  "reason": "POOR_SERVICE",
                  "description": "Ikinci sikayet denemesi test amacli yazilmistir."
                }
                """.formatted(application.applicationId()))
            .exchange()
            .expectStatus().isEqualTo(422)
            .expectBody()
            .jsonPath("$.code").isEqualTo("BUSINESS_RULE_VIOLATION");
    }

    @Test
    void complaintForForeignApplication_returns403() {
        AuthResponse business = api().registerBusiness("c-forbidden-biz");
        AuthResponse individual = api().registerIndividual("c-forbidden-user");
        AuthResponse other = api().registerIndividual("c-forbidden-other");
        AuthResponse admin = api().loginAdmin();

        ListingResponse listing = api().createListing(business.accessToken());
        api().approveListing(admin.accessToken(), listing.id());
        ApplicationResponse application = api().apply(individual.accessToken(), listing.id());
        api().acceptApplication(business.accessToken(), application.applicationId());

        webTestClient.post()
            .uri("/api/individual/complaints")
            .headers(h -> h.setBearerAuth(other.accessToken()))
            .contentType(MediaType.APPLICATION_JSON)
            .bodyValue("""
                {
                  "applicationId": "%s",
                  "reason": "FRAUD",
                  "description": "Baskasinin basvurusu icin sikayet denemesi test metni."
                }
                """.formatted(application.applicationId()))
            .exchange()
            .expectStatus().isForbidden();
    }
}
