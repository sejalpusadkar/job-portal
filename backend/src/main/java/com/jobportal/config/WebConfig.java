package com.jobportal.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Serves uploaded files from the local filesystem.
 * In production you should prefer object storage (S3/MinIO), but this is a safe default.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Global CORS for browser-based frontends (Vercel, etc.)
        // For simplicity (and per requirement), allow all origins.
        // We do not allow credentials because JWT is sent via Authorization header.
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Example URL: /uploads/<filename>
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + normalizeDir(uploadDir) + "/");
    }

    private static String normalizeDir(String dir) {
        if (dir == null || dir.isBlank()) return "uploads";
        return dir.endsWith("/") ? dir.substring(0, dir.length() - 1) : dir;
    }
}
