package com.jobportal.auth;

import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findTopByUserIdAndTokenSha256AndUsedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
            Long userId, String tokenSha256, Instant now);
}

