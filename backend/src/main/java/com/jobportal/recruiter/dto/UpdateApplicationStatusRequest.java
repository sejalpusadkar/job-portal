package com.jobportal.recruiter.dto;

import com.jobportal.application.ApplicationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateApplicationStatusRequest {
    @NotNull private ApplicationStatus status;
}

