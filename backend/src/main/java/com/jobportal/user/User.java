package com.jobportal.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false, unique = true, length = 254)
    private String email;

    /**
     * Legacy schema compatibility:
     * The current MySQL `users` table contains BOTH `password` and `password_hash` as NOT NULL.
     * We store the same bcrypt hash in both columns to satisfy the schema and keep auth consistent.
     */
    @Column(name = "password", nullable = false)
    private String password = "";

    @Column(name = "password_hash", nullable = false)
    private String passwordHash = "";

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 16)
    private Role role;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    /**
     * Recruiters cannot use recruiter APIs until approved by Admin.
     * For non-recruiters this remains false.
     */
    @Column(name = "recruiter_approved", nullable = false)
    private boolean recruiterApproved = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
