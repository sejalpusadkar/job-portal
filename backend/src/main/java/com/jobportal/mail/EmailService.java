package com.jobportal.mail;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
@RequiredArgsConstructor
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String from;

    @Value("${spring.mail.from:}")
    private String fromOverride;

    @Value("${spring.mail.host:}")
    private String host;

    @Value("${spring.mail.password:}")
    private String password;

    @Value("${mail.required:false}")
    private boolean mailRequired;

    public boolean isConfigured() {
        return host != null
                && !host.isBlank()
                && from != null
                && !from.isBlank()
                && password != null
                && !password.isBlank();
    }

    public void send(String to, String subject, String text) {
        if (!isConfigured()) {
            if (mailRequired) {
                throw new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Email is not configured. Set SMTP_* environment variables.");
            }
            // Local development default: don't hard fail if SMTP isn't configured.
            log.info("Email skipped (SMTP not configured). To={}, Subject={}, Text={}", to, subject, text);
            return;
        }
        log.info("Sending email. To={}, Subject={}", to, subject);
        var msg = new SimpleMailMessage();
        String effectiveFrom =
                (fromOverride != null && !fromOverride.isBlank()) ? fromOverride : from;
        msg.setFrom(effectiveFrom);
        msg.setTo(to);
        msg.setSubject(subject);
        msg.setText(text);
        try {
            mailSender.send(msg);
            log.info("Email sent. To={}, Subject={}", to, subject);
        } catch (Exception e) {
            log.error("Email send FAILED. To={}, Subject={}", to, subject, e);
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Email delivery failed. Check SMTP settings (Gmail App Password) and try again.");
        }
    }
}
