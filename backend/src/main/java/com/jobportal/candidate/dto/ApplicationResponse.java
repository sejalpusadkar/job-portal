package com.jobportal.candidate.dto;

import com.jobportal.application.ApplicationStatus;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class ApplicationResponse {
    private Long id;
    private Long jobId;
    private String jobTitle;
    private ApplicationStatus status;
    private Instant appliedAt;
    private Instant updatedAt;
}

