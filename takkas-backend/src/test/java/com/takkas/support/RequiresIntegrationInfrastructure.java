package com.takkas.support;

import org.junit.jupiter.api.extension.ConditionEvaluationResult;
import org.junit.jupiter.api.extension.ExecutionCondition;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.extension.ExtensionContext;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.sql.DriverManager;

/**
 * Integration testleri yalnizca Postgres + Redis ulasilabilir oldugunda calistirir.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@ExtendWith(RequiresIntegrationInfrastructure.RequiresIntegrationInfrastructureCondition.class)
public @interface RequiresIntegrationInfrastructure {

    class RequiresIntegrationInfrastructureCondition implements ExecutionCondition {

        @Override
        public ConditionEvaluationResult evaluateExecutionCondition(ExtensionContext context) {
            if (TestEnvironment.dockerAvailable()) {
                return ConditionEvaluationResult.enabled("Docker mevcut — Testcontainers kullanilacak.");
            }
            if (localPostgresReachable() && localRedisReachable()) {
                return ConditionEvaluationResult.enabled("Yerel Postgres + Redis ulasilabilir.");
            }
            return ConditionEvaluationResult.disabled(
                "Integration test icin Docker Desktop veya yerel Postgres + Redis gerekli.");
        }

        private boolean localPostgresReachable() {
            String url = System.getenv().getOrDefault("TEST_DB_URL",
                "jdbc:postgresql://localhost:5432/takkas");
            String user = System.getenv().getOrDefault("TEST_DB_USER", "takkas");
            String pass = System.getenv().getOrDefault("TEST_DB_PASS", "takkas");
            try (var conn = DriverManager.getConnection(url, user, pass)) {
                return conn.isValid(2);
            } catch (Exception ex) {
                return false;
            }
        }

        private boolean localRedisReachable() {
            String host = System.getenv().getOrDefault("TEST_REDIS_HOST", "localhost");
            int port = Integer.parseInt(System.getenv().getOrDefault("TEST_REDIS_PORT", "6379"));
            try (var socket = new java.net.Socket()) {
                socket.connect(new java.net.InetSocketAddress(host, port), 2000);
                return true;
            } catch (Exception ex) {
                return false;
            }
        }
    }
}
