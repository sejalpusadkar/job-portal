package com.jobportal.job.dto;

import com.jobportal.job.JobStatus;
import java.time.Instant;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class JobResponse {
    private Long id;
    private String companyName;
    private String recruiterEmail;
    private String title;
    private String description;
    private int minExperienceYears;
    private Set<String> requiredSkills;
    private Set<String> keywords;
    private JobStatus status;
    private Instant createdAt;
}
