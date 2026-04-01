package com.jobportal.candidate.dto;

import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class CandidateProfileResponse {
    private Long id;
    private String email;
    private String fullName;
    private String roleTitle;
    private String location;
    private String phone;
    private String education;
    private String professionalSummary;
    private String profilePhotoDataUrl;
    private String resumeUrl;
    private int experienceYears;
    private Set<String> skills;
    private Set<String> keywords;
}
