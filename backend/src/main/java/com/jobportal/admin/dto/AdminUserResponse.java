package com.jobportal.admin.dto;

import com.jobportal.user.Role;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class AdminUserResponse {
    private Long id;
    private String email;
    private Role role;
    private boolean enabled;
    private boolean recruiterApproved;
    private Instant createdAt;
}

