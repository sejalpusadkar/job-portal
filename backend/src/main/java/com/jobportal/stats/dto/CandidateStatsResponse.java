package com.jobportal.stats.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class CandidateStatsResponse {
    private long applicationsCount;
    private long interviewsCount;
    private long profileViewsCount;
    private Instant updatedAt;
}

