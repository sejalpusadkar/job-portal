package com.jobportal.recruiter.dto;

import com.jobportal.job.JobStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class JobUpsertRequest {
    @NotBlank private String title;
    private String description = "";

    @Min(0)
    private int minExperienceYears;

    @Min(1)
    private int minCtc;

    @Min(1)
    private int maxCtc;

    @NotNull
    private String ctcCurrency = "INR";

    @NotNull
    private String ctcFrequency = "YEARLY"; // YEARLY | MONTHLY

    private boolean salaryHidden = false;

    private List<String> requiredSkills;
    private List<String> keywords;

    private JobStatus status = JobStatus.ACTIVE;

    // Optional attachment for the job post (uploaded via /api/recruiter/job-attachment).
    private String attachmentUrl = "";
    private String attachmentName = "";
}
