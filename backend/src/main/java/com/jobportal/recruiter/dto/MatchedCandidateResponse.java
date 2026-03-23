package com.jobportal.recruiter.dto;

import com.jobportal.application.ApplicationStatus;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class MatchedCandidateResponse {
    private Long candidateUserId;
    private String candidateEmail;
    private String fullName;
    private int experienceYears;
    private String phone;
    private String education;
    private String professionalSummary;
    private String profilePhotoDataUrl;
    private String resumeUrl;
    private Long applicationId;
    private ApplicationStatus applicationStatus;
    private Set<String> skills;
    private Set<String> keywords;
    private int matchScorePercent;
    private int exactSkillMatches;
    private int keywordMatches;
}
