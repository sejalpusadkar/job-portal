package com.jobportal.candidate.dto;

import com.jobportal.application.ApplicationStatus;
import java.time.Instant;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class CandidateApplicationDetailResponse {
    private Long id;
    private ApplicationStatus status;
    private Instant appliedAt;
    private Instant updatedAt;

    private Long jobId;
    private String jobTitle;
    private String jobDescription;
    private int minExperienceYears;
    private int minCtc;
    private int maxCtc;
    private String ctcCurrency;
    private String ctcFrequency;
    private boolean salaryHidden;
    private List<String> requiredSkills;
    private List<String> keywords;

    private Long recruiterUserId;
    private String recruiterEmail;
    private String companyName;
}

