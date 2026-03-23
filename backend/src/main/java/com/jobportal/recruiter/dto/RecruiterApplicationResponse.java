package com.jobportal.recruiter.dto;

import com.jobportal.application.ApplicationStatus;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class RecruiterApplicationResponse {
    private Long applicationId;
    private Long candidateUserId;
    private String candidateEmail;
    private String candidateName;
    private String profilePhotoDataUrl;
    private String resumeUrl;
    private ApplicationStatus status;
    private Instant appliedAt;
    private Instant updatedAt;
}
