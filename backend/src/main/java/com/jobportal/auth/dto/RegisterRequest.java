package com.jobportal.auth.dto;

import com.jobportal.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RegisterRequest {
    @Email @NotBlank private String email;
    @NotBlank private String password;
    @NotNull private Role role;

    // Candidate fields
    private String fullName;
    private String phone;

    // Recruiter fields
    private String companyName;
    private String contactPerson;

    // Admin safety gate
    private String adminRegistrationCode;
}

