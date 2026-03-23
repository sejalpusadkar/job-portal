package com.jobportal.recruiter.dto;

import com.jobportal.job.JobStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import lombok.Data;

@Data
public class JobUpsertRequest {
    @NotBlank private String title;
    private String description = "";

    @Min(0)
    private int minExperienceYears;

    private List<String> requiredSkills;
    private List<String> keywords;

    private JobStatus status = JobStatus.ACTIVE;
}

