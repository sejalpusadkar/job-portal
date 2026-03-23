package com.jobportal.security;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@EnableMethodSecurity
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;

    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @PostConstruct
    void logStartup() {
        log.info("SecurityConfig active. Public endpoints: /api/auth/** and GET /api/jobs/**");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()));
        http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        http.exceptionHandling(
                ex ->
                        ex.authenticationEntryPoint(
                                        (req, res, e) ->
                                                res.sendError(
                                                        HttpServletResponse.SC_UNAUTHORIZED,
                                                        "Unauthorized"))
                                .accessDeniedHandler(
                                        (req, res, e) ->
                                                res.sendError(
                                                        HttpServletResponse.SC_FORBIDDEN,
                                                        "Forbidden")));

        http.authenticationProvider(daoAuthenticationProvider());
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        http.authorizeHttpRequests(
                auth ->
                        auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                // Keep auth endpoints public (register/login/forgot/reset/me).
                                // This avoids accidental 401s due to path variations or future additions.
                                .requestMatchers("/api/auth/**")
                                .permitAll()
                                // Allow the browser to view uploaded assets (photos/resumes) directly.
                                // We keep it to GET so uploads remain protected by role-based APIs.
                                .requestMatchers(HttpMethod.GET, "/uploads/**")
                                .permitAll()
                                .requestMatchers(HttpMethod.HEAD, "/uploads/**")
                                .permitAll()
                                // If an exception occurs in a public endpoint, Spring may forward to /error.
                                // If /error is protected, the client sees a confusing 401 instead of the real 4xx/5xx.
                                .requestMatchers("/error")
                                .permitAll()
                                // Safe actuator endpoints
                                .requestMatchers("/actuator/health", "/actuator/info")
                                .permitAll()
                                // Public job browsing (optional).
                                .requestMatchers(HttpMethod.GET, "/api/jobs/**")
                                .permitAll()
                                .requestMatchers("/api/admin/**")
                                .hasRole("ADMIN")
                                .requestMatchers("/api/candidate/**")
                                .hasRole("CANDIDATE")
                                .requestMatchers("/api/recruiter/**")
                                .hasRole("RECRUITER")
                                .anyRequest()
                                .authenticated());

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider() {
        var provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var cfg = new CorsConfiguration();
        for (String origin : allowedOrigins.split(",")) {
            String o = origin.trim();
            if (!o.isBlank()) cfg.addAllowedOrigin(o);
        }
        cfg.addAllowedHeader("*");
        cfg.addAllowedMethod("*");
        cfg.setAllowCredentials(true);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
