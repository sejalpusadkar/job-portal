package com.jobportal.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class AdminMetricsResponse {
    private long totalUsers;
    private long totalCandidates;
    private long totalRecruiters;
    private long pendingRecruiters;
    private long totalJobs;
    private long totalApplications;
}

