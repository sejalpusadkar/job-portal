package com.jobportal.notification;

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
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_user_id", nullable = false)
    private User recipientUser;

    // Optional actor who triggered the notification (e.g., recruiter who viewed profile).
    @Column(nullable = true)
    private Long actorUserId;

    @Column(nullable = false, length = 32)
    private String type;

    @Column(nullable = false, length = 140)
    private String title;

    @Column(nullable = false, length = 1000)
    private String description = "";

    // Frontend navigates using this relative SPA-friendly URL.
    @Column(nullable = false, length = 512)
    private String actionUrl = "";

    @Column(nullable = true)
    private Instant readAt;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
}

