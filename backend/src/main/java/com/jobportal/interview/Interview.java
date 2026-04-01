package com.jobportal.interview;

import com.jobportal.job.JobPosting;
import com.jobportal.user.User;
import jakarta.persistence.Column;
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
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "interviews")
public class Interview {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private JobPosting job;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_user_id", nullable = false)
    private User candidateUser;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "recruiter_user_id", nullable = false)
    private User recruiterUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private InterviewType type = InterviewType.HR;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private InterviewMode mode = InterviewMode.ONLINE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private InterviewStatus status = InterviewStatus.SCHEDULED;

    @Column(nullable = false)
    private Instant scheduledAt;

    @Column(nullable = false, length = 512)
    private String meetingLink = "";

    @Column(nullable = false, length = 1000)
    private String notes = "";

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}
