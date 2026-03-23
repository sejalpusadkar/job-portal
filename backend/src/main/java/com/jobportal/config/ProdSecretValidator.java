package com.jobportal.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Fail fast in production if secrets are not configured properly.
 */
@Component
@Profile("prod")
public class ProdSecretValidator {
    @Value("${jwt.secret:}")
    private String jwtSecret;

    @PostConstruct
    void validate() {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException("JWT secret is required in production (jwt.secret)");
        }
        if (jwtSecret.contains("CHANGE_ME_IN_PROD")) {
            throw new IllegalStateException("JWT secret is using the default placeholder. Set JWT_SECRET.");
        }
        if (jwtSecret.length() < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 characters for HS256.");
        }
    }
}

