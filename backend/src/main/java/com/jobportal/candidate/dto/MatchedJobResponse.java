package com.jobportal.candidate.dto;

import com.jobportal.job.JobStatus;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class MatchedJobResponse {
    private Long id;
    private String companyName;
    private String recruiterEmail;
    private String title;
    private String description;
    private int minExperienceYears;
    private int matchScorePercent;
    private int exactSkillMatches;
    private int keywordMatches;
    private JobStatus status;
    private Instant createdAt;
}
