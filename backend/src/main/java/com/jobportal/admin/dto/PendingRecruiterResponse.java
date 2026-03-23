package com.jobportal.admin.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class PendingRecruiterResponse {
    private Long userId;
    private String email;
    private String companyName;
    private String contactPerson;
    private String phone;
    private Instant createdAt;
}

