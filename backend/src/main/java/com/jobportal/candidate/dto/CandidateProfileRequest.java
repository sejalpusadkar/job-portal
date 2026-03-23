package com.jobportal.candidate.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.Data;

@Data
public class CandidateProfileRequest {
    @NotBlank private String fullName;
    @NotBlank private String phone;
    private String education = "";
    private String professionalSummary = "";
    // Data URL (base64) from the UI. Keep small (client enforces a size limit).
    private String profilePhotoDataUrl = "";

    @Min(0)
    private int experienceYears;

    private List<String> skills;
    private List<String> keywords;
}
