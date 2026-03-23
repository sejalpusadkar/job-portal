package com.jobportal.auth;

import com.jobportal.auth.dto.AuthResponse;
import com.jobportal.auth.dto.ForgotPasswordRequest;
import com.jobportal.auth.dto.ForgotPasswordResponse;
import com.jobportal.auth.dto.LoginRequest;
import com.jobportal.auth.dto.MeResponse;
import com.jobportal.auth.dto.RegisterRequest;
import com.jobportal.auth.dto.ResetPasswordRequest;
import com.jobportal.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @GetMapping("/ping")
    public String ping() {
        return "ok";
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest req) {
        return authService.login(req);
    }

    @PostMapping("/forgot-password")
    public ForgotPasswordResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        return authService.forgotPassword(req.getEmail());
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
    }

    @GetMapping("/me")
    public MeResponse me(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal p)) {
            return MeResponse.builder().id(null).email(null).role(null).recruiterApproved(false).build();
        }
        return MeResponse.builder()
                .id(p.getId())
                .email(p.getEmail())
                .role(p.getRole())
                .recruiterApproved(p.isRecruiterApproved())
                .build();
    }
}
