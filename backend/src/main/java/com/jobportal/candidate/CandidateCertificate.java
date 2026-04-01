package com.jobportal.candidate;

import com.jobportal.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "candidate_certificates")
public class CandidateCertificate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_user_id", nullable = false)
    private User candidateUser;

    // Stored as a URL (e.g. /uploads/...), not raw bytes.
    @Column(nullable = false, length = 512)
    private String fileUrl = "";

    // Original name shown in UI.
    @Column(nullable = false, length = 255)
    private String originalName = "";

    // Stored filename (useful for debugging/cleanup).
    @Column(nullable = false, length = 255)
    private String storedName = "";

    @Column(nullable = false, length = 96)
    private String contentType = "";

    @Column(nullable = false)
    private long sizeBytes = 0L;

    @Column(nullable = false, updatable = false)
    private Instant uploadedAt = Instant.now();
}

