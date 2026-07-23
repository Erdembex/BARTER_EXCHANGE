package com.takkas.support;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Import(IntegrationTestConfig.class)
public abstract class AbstractIntegrationTest {

    private static final boolean USE_DOCKER = TestEnvironment.dockerAvailable();

    private static final PostgreSQLContainer<?> POSTGRES = USE_DOCKER
        ? new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"))
        : null;

    private static final GenericContainer<?> REDIS = USE_DOCKER
        ? new GenericContainer<>(DockerImageName.parse("redis:7-alpine")).withExposedPorts(6379)
        : null;

    static {
        if (USE_DOCKER) {
            POSTGRES.start();
            REDIS.start();
        }
    }

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        if (USE_DOCKER) {
            registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
            registry.add("spring.datasource.username", POSTGRES::getUsername);
            registry.add("spring.datasource.password", POSTGRES::getPassword);
            registry.add("spring.data.redis.host", REDIS::getHost);
            registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379).toString());
        } else {
            registry.add("spring.datasource.url",
                () -> System.getenv().getOrDefault("TEST_DB_URL",
                    "jdbc:postgresql://localhost:5432/takkas"));
            registry.add("spring.datasource.username",
                () -> System.getenv().getOrDefault("TEST_DB_USER", "takkas"));
            registry.add("spring.datasource.password",
                () -> System.getenv().getOrDefault("TEST_DB_PASS", "takkas"));
            registry.add("spring.data.redis.host",
                () -> System.getenv().getOrDefault("TEST_REDIS_HOST", "localhost"));
            registry.add("spring.data.redis.port",
                () -> System.getenv().getOrDefault("TEST_REDIS_PORT", "6379"));
        }
    }

    @LocalServerPort
    protected int port;

    @Autowired
    protected WebTestClient webTestClient;

    protected ApiTestClient api() {
        return new ApiTestClient(webTestClient, port);
    }
}
