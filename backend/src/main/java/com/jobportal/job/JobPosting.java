package com.jobportal.job;

import com.jobportal.user.User;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "job_postings")
public class JobPosting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "recruiter_user_id", nullable = false)
    private User recruiterUser;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 4000)
    private String description = "";

    @Column(nullable = false)
    private int minExperienceYears = 0;

    // Salary/CTC fields (structured). Units:
    // - If frequency = YEARLY: values represent LPA (Lakhs Per Annum) for easier input/display.
    // - If frequency = MONTHLY: values represent thousands per month (K) for easier input/display.
    @Column(nullable = false)
    private int minCtc = 0;

    @Column(nullable = false)
    private int maxCtc = 0;

    @Column(nullable = false, length = 8)
    private String ctcCurrency = "INR";

    @Column(nullable = false, length = 16)
    private String ctcFrequency = "YEARLY"; // YEARLY | MONTHLY

    @Column(nullable = false)
    private boolean salaryHidden = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_required_skills", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "skill", nullable = false, length = 64)
    private Set<String> requiredSkills = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "job_keywords", joinColumns = @JoinColumn(name = "job_id"))
    @Column(name = "keyword", nullable = false, length = 64)
    private Set<String> keywords = new LinkedHashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private JobStatus status = JobStatus.ACTIVE;

    // Optional attachment for job posting (e.g., PDF JD or an image).
    // Stored as a URL (e.g. /uploads/...), not as raw bytes.
    @Column(nullable = false, length = 512)
    private String attachmentUrl = "";

    @Column(nullable = false, length = 255)
    private String attachmentName = "";

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
