package com.jobportal.stats;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "recruiter_stats")
public class RecruiterStats {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false)
    private long activeJobsCount = 0;

    @Column(nullable = false)
    private long totalApplicantsCount = 0;

    @Column(nullable = false)
    private long interviewsScheduledCount = 0;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}

