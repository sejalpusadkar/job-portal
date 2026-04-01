package com.jobportal.recruiter.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class RecruiterNotificationResponse {
    private String type;
    private String message;
    private Instant createdAt;
}

