package com.jobportal.auth;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Simple in-memory rate limiting for auth endpoints (production hygiene).
 * For multi-instance deployments, switch to a distributed bucket backend (Redis).
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {
    private static final String PREFIX = "/api/auth/";

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null) return true;
        if (!path.startsWith(PREFIX)) return true;
        // Only throttle the high-risk endpoints.
        return !(path.equals(PREFIX + "login")
                || path.equals(PREFIX + "register")
                || path.equals(PREFIX + "forgot-password")
                || path.equals(PREFIX + "reset-password"));
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        String ip = clientIp(request);

        Bucket bucket = buckets.computeIfAbsent(ip + "|" + path, k -> newBucketFor(path));
        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"message\":\"Too many requests. Please try again later.\"}");
    }

    private static Bucket newBucketFor(String path) {
        Bandwidth limit;
        if (path.endsWith("/login")) {
            limit = Bandwidth.classic(10, Refill.greedy(10, Duration.ofMinutes(1)));
        } else if (path.endsWith("/register")) {
            limit = Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(10)));
        } else if (path.endsWith("/forgot-password")) {
            limit = Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(10)));
        } else if (path.endsWith("/reset-password")) {
            limit = Bandwidth.classic(10, Refill.greedy(10, Duration.ofMinutes(10)));
        } else {
            limit = Bandwidth.classic(30, Refill.greedy(30, Duration.ofMinutes(1)));
        }
        return Bucket.builder().addLimit(limit).build();
    }

    private static String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // First IP is the original client.
            String first = xff.split(",")[0].trim();
            if (!first.isBlank()) return first;
        }
        String real = request.getHeader("X-Real-IP");
        if (real != null && !real.isBlank()) return real.trim();
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }
}

