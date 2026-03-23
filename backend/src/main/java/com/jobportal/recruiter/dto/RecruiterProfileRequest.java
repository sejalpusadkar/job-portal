package com.jobportal.recruiter.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RecruiterProfileRequest {
    @NotBlank private String companyName;
    @NotBlank private String contactPerson;
    @NotBlank private String phone;
    private String position = "";
    private String professionalSummary = "";
    private String profilePhotoUrl = "";
}

