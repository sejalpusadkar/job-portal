package com.jobportal.activity.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class ActivityResponse {
    private Long id;
    private String type;
    private String message;
    private Instant createdAt;
    private Long jobId;
    private Long candidateUserId;
}

