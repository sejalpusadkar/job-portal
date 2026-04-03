package com.jobportal.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Global CORS configuration for browser-based frontends (Vercel, etc.).
 *
 * Notes:
 * - We do not use cookies (JWT is sent via Authorization header), so wildcard origins are safe here.
 * - Spring Security also enables CORS via its filter chain; this config ensures MVC handlers are CORS-ready too.
 */
@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("*")
                        .allowedHeaders("*");
            }
        };
    }
}

