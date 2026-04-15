package com.jobportal.security;

import com.jobportal.user.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expirationMs;

    private Key signingKey;

    @PostConstruct
    public void init() {
        if (secret == null || secret.trim().length() < 32) {
            throw new IllegalArgumentException("JWT secret must be at least 32 characters long");
        }
        // Use raw string bytes (NOT Base64) unless you explicitly store Base64 in env.
        // This avoids Decoders.BASE64 errors when secrets contain non-base64 chars.
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Long userId, String email, Role role, boolean recruiterApproved) {
        Instant now = Instant.now();
        Instant exp = now.plusMillis(expirationMs);

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .addClaims(
                        Map.of(
                                "uid", userId,
                                "role", role.name(),
                                "recruiterApproved", recruiterApproved))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(signingKey).build().parseClaimsJws(token).getBody();
    }

    public boolean isTokenValid(String token, String expectedEmail) {
        Claims claims = parseClaims(token);
        String subject = claims.getSubject();
        Date expiration = claims.getExpiration();
        return subject != null
                && subject.equalsIgnoreCase(expectedEmail)
                && expiration != null
                && expiration.after(new Date());
    }
}
