package com.takkas.support;

import org.testcontainers.DockerClientFactory;

public final class TestEnvironment {

    private TestEnvironment() {}

    public static boolean dockerAvailable() {
        try {
            return DockerClientFactory.instance().isDockerAvailable();
        } catch (Exception ex) {
            return false;
        }
    }
}
