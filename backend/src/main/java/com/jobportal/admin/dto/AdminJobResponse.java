package com.jobportal.admin.dto;

import com.jobportal.job.JobStatus;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class AdminJobResponse {
    private Long id;
    private String title;
    private String recruiterEmail;
    private JobStatus status;
    private Instant createdAt;
}

