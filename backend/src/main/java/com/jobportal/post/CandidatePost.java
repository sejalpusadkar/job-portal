package com.jobportal.post;

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
@Table(name = "candidate_posts")
public class CandidatePost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_user_id", nullable = false)
    private User candidateUser;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CandidatePostType type = CandidatePostType.UPDATE;

    @Column(nullable = false, length = 4000)
    private String content = "";

    @Column(nullable = false, length = 512)
    private String imageUrl = "";

    @Column(nullable = false, length = 512)
    private String linkUrl = "";

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}

