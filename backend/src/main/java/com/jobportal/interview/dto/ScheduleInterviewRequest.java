package com.jobportal.interview.dto;

import com.jobportal.interview.InterviewMode;
import com.jobportal.interview.InterviewType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import lombok.Data;

@Data
public class ScheduleInterviewRequest {
    @NotNull private Long jobId;
    @NotNull private Long candidateUserId;
    @NotNull private InterviewType type;
    @NotNull private InterviewMode mode;

    @NotNull @Future private Instant scheduledAt;

    @Size(max = 512)
    private String meetingLink;

    @Size(max = 1000)
    private String notes;
}

