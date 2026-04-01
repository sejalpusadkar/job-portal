package com.jobportal.interview.dto;

import com.jobportal.interview.InterviewMode;
import com.jobportal.interview.InterviewStatus;
import com.jobportal.interview.InterviewType;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class InterviewResponse {
    private Long id;
    private Long jobId;
    private String jobTitle;
    private String companyName;
    private Long candidateUserId;
    private String candidateName;
    private String candidateRoleTitle;
    private String candidatePhotoDataUrl;
    private Long recruiterUserId;
    private InterviewType type;
    private InterviewMode mode;
    private InterviewStatus status;
    private Instant scheduledAt;
    private String meetingLink;
    private String notes;
}
