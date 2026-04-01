package com.jobportal.recruiter.dto;

import com.jobportal.job.JobStatus;
import java.time.Instant;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class RecruiterJobResponse {
    private Long id;
    private String title;
    private String description;
    private int minExperienceYears;
    private int minCtc;
    private int maxCtc;
    private String ctcCurrency;
    private String ctcFrequency;
    private boolean salaryHidden;
    private Set<String> requiredSkills;
    private Set<String> keywords;
    private JobStatus status;
    private String attachmentUrl;
    private String attachmentName;
    private Instant createdAt;
}
