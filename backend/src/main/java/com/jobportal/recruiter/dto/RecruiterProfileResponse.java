package com.jobportal.recruiter.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class RecruiterProfileResponse {
    private Long id;
    private Long userId;
    private String email;
    private String companyName;
    private String contactPerson;
    private String phone;
    private String position;
    private String professionalSummary;
    private String profilePhotoUrl;
}

