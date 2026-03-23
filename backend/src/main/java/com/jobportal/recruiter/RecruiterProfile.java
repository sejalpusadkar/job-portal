package com.jobportal.recruiter;

import com.jobportal.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "recruiter_profiles")
public class RecruiterProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // Read-only view of the FK, avoids lazy-loading the User just to get its id.
    @Column(name = "user_id", insertable = false, updatable = false)
    private Long userId;

    @Column(nullable = false)
    private String companyName = "";

    @Column(nullable = false)
    private String contactPerson = "";

    @Column(nullable = false)
    private String phone = "";

    @Column(nullable = false, length = 128)
    private String position = "";

    @Column(name = "professional_summary", nullable = false, length = 2000)
    private String professionalSummary = "";

    // Stored as a URL (e.g. /uploads/...), not as raw bytes.
    @Column(name = "profile_photo_url", nullable = false, length = 512)
    private String profilePhotoUrl = "";
}
