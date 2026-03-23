package com.jobportal.candidate;

import com.jobportal.user.User;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.LinkedHashSet;
import java.util.Set;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "candidate_profiles")
public class CandidateProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String fullName = "";

    @Column(nullable = false)
    private String phone = "";

    @Column(nullable = false)
    private String education = "";

    @Column(nullable = false)
    private int experienceYears = 0;

    @Column(name = "professional_summary", nullable = false, length = 2000)
    private String professionalSummary = "";

    @Lob
    @Column(name = "profile_photo", columnDefinition = "LONGTEXT", nullable = false)
    private String profilePhotoDataUrl = "";

    @Column(name = "resume_url", nullable = false, length = 512)
    private String resumeUrl = "";

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "candidate_skills", joinColumns = @JoinColumn(name = "candidate_profile_id"))
    @Column(name = "skill", nullable = false, length = 64)
    private Set<String> skills = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "candidate_keywords", joinColumns = @JoinColumn(name = "candidate_profile_id"))
    @Column(name = "keyword", nullable = false, length = 64)
    private Set<String> keywords = new LinkedHashSet<>();
}
