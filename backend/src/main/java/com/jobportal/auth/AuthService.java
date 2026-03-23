package com.jobportal.auth;

import com.jobportal.auth.dto.AuthResponse;
import com.jobportal.auth.dto.ForgotPasswordResponse;
import com.jobportal.auth.dto.LoginRequest;
import com.jobportal.auth.dto.RegisterRequest;
import com.jobportal.auth.dto.ResetPasswordRequest;
import com.jobportal.candidate.CandidateProfile;
import com.jobportal.candidate.CandidateProfileRepository;
import com.jobportal.mail.EmailService;
import com.jobportal.recruiter.RecruiterProfile;
import com.jobportal.recruiter.RecruiterProfileRepository;
import com.jobportal.security.JwtService;
import com.jobportal.user.Role;
import com.jobportal.user.User;
import com.jobportal.user.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final CandidateProfileRepository candidateProfileRepository;
    private final RecruiterProfileRepository recruiterProfileRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;

    @Value("${admin.registration.code:}")
    private String adminRegistrationCode;

    @Value("${password.reset.debug:false}")
    private boolean passwordResetDebug;

    public void register(RegisterRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        List<String> pwErrors = PasswordPolicy.validate(req.getPassword());
        if (!pwErrors.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, String.join("; ", pwErrors));
        }

        if (req.getRole() == Role.ADMIN) {
            if (adminRegistrationCode == null
                    || adminRegistrationCode.isBlank()
                    || !adminRegistrationCode.equals(req.getAdminRegistrationCode())) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Admin registration is disabled (invalid admin registration code)");
            }
        }

        var user = new User();
        user.setEmail(email);
        String hashed = passwordEncoder.encode(req.getPassword());
        // Write both legacy `password` and `password_hash` columns.
        user.setPassword(hashed);
        user.setPasswordHash(hashed);
        user.setRole(req.getRole());
        if (req.getRole() == Role.RECRUITER) {
            user.setRecruiterApproved(false);
        }
        userRepository.save(user);

        if (req.getRole() == Role.CANDIDATE) {
            var profile = new CandidateProfile();
            profile.setUser(user);
            profile.setFullName(nullToEmpty(req.getFullName()));
            profile.setPhone(nullToEmpty(req.getPhone()));
            candidateProfileRepository.save(profile);
        } else if (req.getRole() == Role.RECRUITER) {
            var rp = new RecruiterProfile();
            rp.setUser(user);
            rp.setCompanyName(nullToEmpty(req.getCompanyName()));
            rp.setContactPerson(nullToEmpty(req.getContactPerson()));
            rp.setPhone(nullToEmpty(req.getPhone()));
            recruiterProfileRepository.save(rp);
        }
    }

    public AuthResponse login(LoginRequest req) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        } catch (AuthenticationException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        var user =
                userRepository
                        .findByEmailIgnoreCase(req.getEmail())
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        String token =
                jwtService.generateToken(
                        user.getId(), user.getEmail(), user.getRole(), user.isRecruiterApproved());

        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .recruiterApproved(user.isRecruiterApproved())
                .build();
    }

    public ForgotPasswordResponse forgotPassword(String email) {
        // Do not reveal whether the email exists.
        var userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty() || !userOpt.get().isEnabled()) {
            return ForgotPasswordResponse.builder()
                    .message("If the account exists, a reset link has been sent.")
                    .debugToken(null)
                    .build();
        }

        var user = userOpt.get();
        String token = generateToken();
        String tokenHash = sha256Hex(token);

        var prt = new PasswordResetToken();
        prt.setUser(user);
        prt.setTokenSha256(tokenHash);
        prt.setExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
        passwordResetTokenRepository.save(prt);

        String link =
                "http://localhost:3000/reset-password?email="
                        + urlEncode(user.getEmail())
                        + "&token="
                        + urlEncode(token);

        String body =
                "We received a request to reset your password.\n\n"
                        + "Use this link to set a new password (valid for 15 minutes):\n"
                        + link
                        + "\n\n"
                        + "If you did not request this, you can ignore this email.";

        emailService.send(user.getEmail(), "Password Reset - IT Job Portal", body);

        return ForgotPasswordResponse.builder()
                .message("If the account exists, a reset link has been sent.")
                .debugToken(passwordResetDebug ? token : null)
                .build();
    }

    public void resetPassword(ResetPasswordRequest req) {
        List<String> pwErrors = PasswordPolicy.validate(req.getNewPassword());
        if (!pwErrors.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, String.join("; ", pwErrors));
        }

        var user =
                userRepository
                        .findByEmailIgnoreCase(req.getEmail())
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST, "Invalid reset token"));

        String tokenHash = sha256Hex(req.getToken());
        var token =
                passwordResetTokenRepository
                        .findTopByUserIdAndTokenSha256AndUsedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
                                user.getId(), tokenHash, Instant.now())
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST, "Invalid reset token"));

        token.setUsedAt(Instant.now());
        passwordResetTokenRepository.save(token);

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s.trim();
    }

    private static final SecureRandom RNG = new SecureRandom();

    private static String generateToken() {
        byte[] bytes = new byte[32];
        RNG.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private static String sha256Hex(String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest((value == null ? "" : value).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private static String urlEncode(String s) {
        try {
            return java.net.URLEncoder.encode(s == null ? "" : s, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "";
        }
    }
}
