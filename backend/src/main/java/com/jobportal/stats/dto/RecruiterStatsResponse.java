package com.jobportal.stats.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class RecruiterStatsResponse {
    private long activeJobsCount;
    private long totalApplicantsCount;
    private long interviewsScheduledCount;
    private Instant updatedAt;
}

