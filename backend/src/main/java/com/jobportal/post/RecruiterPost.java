package com.jobportal.post;

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
@Table(name = "recruiter_posts")
public class RecruiterPost {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "recruiter_user_id", nullable = false)
    private User recruiterUser;

    @Column(nullable = false, length = 2000)
    private String caption = "";

    @Column(name = "image_url", nullable = false, length = 512)
    private String imageUrl = "";

    @Column(name = "share_count", nullable = false)
    private int shareCount = 0;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}

