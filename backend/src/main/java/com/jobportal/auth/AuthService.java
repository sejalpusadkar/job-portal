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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
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

    @Value("${app.frontend.origin:http://localhost:3000}")
    private String frontendOrigin;

    @Transactional
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
            String providedCode =
                    req.getAdminRegistrationCode() == null ? "" : req.getAdminRegistrationCode().trim();
            String expectedCode = adminRegistrationCode == null ? "" : adminRegistrationCode.trim();
            if (adminRegistrationCode == null
                    || adminRegistrationCode.isBlank()
                    || !expectedCode.equals(providedCode)) {
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
        user = userRepository.saveAndFlush(user);

        // Safety: if DB defaults/triggers ever alter the stored hash, fix it immediately so login works.
        // This also makes registration failures obvious instead of creating "can't login" ghost accounts.
        var persisted =
                userRepository
                        .findById(user.getId())
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.INTERNAL_SERVER_ERROR,
                                                "Registration failed to persist user"));
        boolean ok =
                persisted.getPasswordHash() != null
                        && !persisted.getPasswordHash().isBlank()
                        && passwordEncoder.matches(req.getPassword(), persisted.getPasswordHash());
        if (!ok) {
            persisted.setPassword(hashed);
            persisted.setPasswordHash(hashed);
            userRepository.saveAndFlush(persisted);
            persisted =
                    userRepository
                            .findById(user.getId())
                            .orElseThrow(
                                    () ->
                                            new ResponseStatusException(
                                                    HttpStatus.INTERNAL_SERVER_ERROR,
                                                    "Registration failed to persist user"));
            ok =
                    persisted.getPasswordHash() != null
                            && !persisted.getPasswordHash().isBlank()
                            && passwordEncoder.matches(req.getPassword(), persisted.getPasswordHash());
        }
        if (!ok) {
            log.error(
                    "Registration integrity check failed for email={} id={} enabled={} recruiterApproved={} hashBlank={}",
                    email,
                    persisted.getId(),
                    persisted.isEnabled(),
                    persisted.isRecruiterApproved(),
                    persisted.getPasswordHash() == null || persisted.getPasswordHash().isBlank());
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Registration failed (password persistence). Please try again.");
        }

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
        String email = req.getEmail() == null ? "" : req.getEmail().trim().toLowerCase();
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, req.getPassword()));
        } catch (AuthenticationException ex) {
            // Help diagnose "can register but can't login" issues without leaking details to the client.
            userRepository
                    .findByEmailIgnoreCase(email)
                    .ifPresent(
                            u ->
                                    log.warn(
                                            "Login failed for email={} id={} enabled={} recruiterApproved={} hashBlank={}",
                                            email,
                                            u.getId(),
                                            u.isEnabled(),
                                            u.isRecruiterApproved(),
                                            u.getPasswordHash() == null || u.getPasswordHash().isBlank()));
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        var user =
                userRepository
                        .findByEmailIgnoreCase(email)
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
        // If email service isn't configured, return a non-leaky message for all requests.
        // This avoids "silent success" that confuses users, and doesn't reveal whether the email exists.
        boolean mailConfigured = emailService.isConfigured();
        if (!mailConfigured) {
            return ForgotPasswordResponse.builder()
                    .message(
                            "Password reset email service is not configured. Set SMTP_* environment variables and try again.")
                    .debugToken(null)
                    .debugLink(null)
                    .emailServiceConfigured(false)
                    .build();
        }

        // Do not reveal whether the email exists.
        // To avoid "silent success" for users (and avoid leaking existence via SMTP failures),
        // we always attempt to send an email to the requested address.
        // If the account exists: email contains a real reset link.
        // If not: email contains generic guidance (no reset link).
        String normalizedEmail = (email == null) ? "" : email.trim().toLowerCase();
        var userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        String subject = "Reset Your Password";
        String body;
        String token = null;
        String link = null;

        if (userOpt.isPresent()) {
            var user = userOpt.get();
            token = generateToken();
            String tokenHash = sha256Hex(token);

            var prt = new PasswordResetToken();
            prt.setUser(user);
            prt.setTokenSha256(tokenHash);
            prt.setExpiresAt(Instant.now().plus(15, ChronoUnit.MINUTES));
            passwordResetTokenRepository.save(prt);

            String base = (frontendOrigin == null || frontendOrigin.isBlank()) ? "http://localhost:3000" : frontendOrigin.trim();
            if (base.endsWith("/")) base = base.substring(0, base.length() - 1);
            link =
                    base
                            + "/reset-password?email="
                            + urlEncode(user.getEmail())
                            + "&token="
                            + urlEncode(token);

            body =
                    "We received a request to reset your password.\n\n"
                            + "Use this link to set a new password (valid for 15 minutes):\n"
                            + link
                            + "\n\n"
                            + "If you did not request this, you can ignore this email.";
        } else {
            body =
                    "We received a request to reset a password for this email address.\n\n"
                            + "If you have an account, please make sure you entered the same email you used during registration and try again.\n"
                            + "If you do not have an account, you can register on the portal.\n\n"
                            + "If you did not request this, you can ignore this email.";
        }

        // Send to the requested email address (always), so users get feedback in their inbox.
        emailService.send(normalizedEmail, subject, body);

        return ForgotPasswordResponse.builder()
                .message("If the account exists, a reset link has been sent.")
                .debugToken(passwordResetDebug ? token : null)
                .debugLink(passwordResetDebug ? link : null)
                .emailServiceConfigured(true)
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

        String hashed = passwordEncoder.encode(req.getNewPassword());
        // Keep legacy columns in sync.
        user.setPassword(hashed);
        user.setPasswordHash(hashed);
        userRepository.save(user);
    }

    public void validateResetToken(String email, String tokenPlain) {
        var user =
                userRepository
                        .findByEmailIgnoreCase(email)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST, "Link expired or invalid"));
        String tokenHash = sha256Hex(tokenPlain);
        passwordResetTokenRepository
                .findTopByUserIdAndTokenSha256AndUsedAtIsNullAndExpiresAtAfterOrderByCreatedAtDesc(
                        user.getId(), tokenHash, Instant.now())
                .orElseThrow(
                        () ->
                                new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST, "Link expired or invalid"));
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
