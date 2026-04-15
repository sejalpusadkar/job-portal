package com.jobportal.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

/**
 * Render Postgres compatibility:
 * Render provides DATABASE_URL in the form: postgres://user:pass@host:port/db
 *
 * Spring Boot expects a JDBC URL. If DB_URL isn't provided, we build a JDBC URL
 * from DATABASE_URL so JPA can initialize entityManagerFactory reliably.
 *
 * This config runs only in the "prod" profile.
 */
@Configuration
@Profile("prod")
public class RenderPostgresDataSourceConfig {

    @Bean
    public DataSource dataSource(Environment env) {
        String dbUrl = firstNonBlank(env.getProperty("DB_URL"), env.getProperty("SPRING_DATASOURCE_URL"));
        String dbUser = firstNonBlank(env.getProperty("DB_USERNAME"), env.getProperty("SPRING_DATASOURCE_USERNAME"));
        String dbPass = firstNonBlank(env.getProperty("DB_PASSWORD"), env.getProperty("SPRING_DATASOURCE_PASSWORD"));

        if (isBlank(dbUrl)) {
            String databaseUrl = env.getProperty("DATABASE_URL");
            if (!isBlank(databaseUrl)) {
                ParsedDb parsed = parseRenderDatabaseUrl(databaseUrl);
                dbUrl = parsed.jdbcUrl;
                dbUser = parsed.username;
                dbPass = parsed.password;
            }
        }

        if (isBlank(dbUrl)) {
            throw new IllegalStateException(
                    "Database is not configured. Set DB_URL/DB_USERNAME/DB_PASSWORD or attach Render Postgres (DATABASE_URL).");
        }

        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl(dbUrl);
        if (!isBlank(dbUser)) cfg.setUsername(dbUser);
        if (!isBlank(dbPass)) cfg.setPassword(dbPass);
        cfg.setDriverClassName("org.postgresql.Driver");
        return new HikariDataSource(cfg);
    }

    private static ParsedDb parseRenderDatabaseUrl(String databaseUrl) {
        try {
            URI uri = URI.create(databaseUrl);
            // Render uses postgres://
            String host = uri.getHost();
            int port = uri.getPort() == -1 ? 5432 : uri.getPort();
            String db = uri.getPath();

            String user = null;
            String pass = null;
            String userInfo = uri.getUserInfo();
            if (userInfo != null) {
                int idx = userInfo.indexOf(':');
                if (idx >= 0) {
                    user = userInfo.substring(0, idx);
                    pass = userInfo.substring(idx + 1);
                } else {
                    user = userInfo;
                }
            }

            // Convert to JDBC URL expected by the Postgres driver.
            // Keep params minimal; users can override with DB_URL if they want sslmode, etc.
            String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + db;
            return new ParsedDb(jdbcUrl, user, pass);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse DATABASE_URL for Postgres.", e);
        }
    }

    private static String firstNonBlank(String a, String b) {
        return !isBlank(a) ? a : (!isBlank(b) ? b : null);
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private record ParsedDb(String jdbcUrl, String username, String password) {}
}

