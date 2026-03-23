package com.jobportal.security;

import com.jobportal.user.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final Key signingKey;
    private final long expirationMs;

    public JwtService(
            @Value("${jwt.secret}") String jwtSecret,
            @Value("${jwt.expiration}") long expirationMs) {
        // Support either plain text (>= 32 chars for HS256) or base64 secrets.
        byte[] keyBytes;
        if (jwtSecret.matches("^[A-Za-z0-9+/=]+$") && jwtSecret.length() % 4 == 0) {
            try {
                keyBytes = Decoders.BASE64.decode(jwtSecret);
            } catch (IllegalArgumentException ignored) {
                keyBytes = jwtSecret.getBytes();
            }
        } else {
            keyBytes = jwtSecret.getBytes();
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.expirationMs = expirationMs;
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

