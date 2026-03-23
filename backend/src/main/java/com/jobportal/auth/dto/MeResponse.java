package com.jobportal.auth.dto;

import com.jobportal.user.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class MeResponse {
    private Long id;
    private String email;
    private Role role;
    private boolean recruiterApproved;
}

