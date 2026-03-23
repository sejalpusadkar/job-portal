package com.jobportal.recruiter.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendEmailRequest {
    @NotBlank private String subject;
    @NotBlank private String message;
}

