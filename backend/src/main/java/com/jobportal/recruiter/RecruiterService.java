package com.jobportal.recruiter;

import com.jobportal.application.JobApplicationRepository;
import com.jobportal.candidate.CandidateProfileRepository;
import com.jobportal.common.TextUtils;
import com.jobportal.job.JobPosting;
import com.jobportal.job.JobPostingRepository;
import com.jobportal.mail.EmailService;
import com.jobportal.matching.MatchingService;
import com.jobportal.notification.NotificationService;
import com.jobportal.notification.NotificationType;
import com.jobportal.activity.ActivityService;
import com.jobportal.activity.ActivityType;
import com.jobportal.recruiter.dto.JobUpsertRequest;
import com.jobportal.recruiter.dto.MatchedCandidateResponse;
import com.jobportal.recruiter.dto.RecruiterApplicationResponse;
import com.jobportal.recruiter.dto.RecruiterJobResponse;
import com.jobportal.recruiter.dto.RecruiterNotificationResponse;
import com.jobportal.user.Role;
import com.jobportal.user.UserRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class RecruiterService {
    private static final Logger log = LoggerFactory.getLogger(RecruiterService.class);

    private final UserRepository userRepository;
    private final JobPostingRepository jobPostingRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final MatchingService matchingService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final ActivityService activityService;

    @Transactional(readOnly = true)
    public List<RecruiterJobResponse> myJobs(Long recruiterUserId) {
        ensureRecruiterApproved(recruiterUserId);
        return jobPostingRepository.findByRecruiterUserIdOrderByCreatedAtDesc(recruiterUserId).stream()
                .map(RecruiterService::toJobDto)
                .toList();
    }

    @Transactional
    public RecruiterJobResponse createJob(Long recruiterUserId, JobUpsertRequest req) {
        var recruiter = ensureRecruiterApproved(recruiterUserId);

        int minCtc = Math.max(0, req.getMinCtc());
        int maxCtc = Math.max(0, req.getMaxCtc());
        if (minCtc <= 0 || maxCtc <= 0 || minCtc > maxCtc) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter valid salary range");
        }
        String currency = (req.getCtcCurrency() == null) ? "INR" : req.getCtcCurrency().trim().toUpperCase();
        String freq = (req.getCtcFrequency() == null) ? "YEARLY" : req.getCtcFrequency().trim().toUpperCase();
        if (!freq.equals("YEARLY") && !freq.equals("MONTHLY")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid salary frequency");
        }

        var job = new JobPosting();
        job.setRecruiterUser(recruiter);
        job.setTitle(req.getTitle().trim());
        job.setDescription(req.getDescription() == null ? "" : req.getDescription().trim());
        job.setMinExperienceYears(Math.max(0, req.getMinExperienceYears()));
        job.setMinCtc(minCtc);
        job.setMaxCtc(maxCtc);
        job.setCtcCurrency(currency);
        job.setCtcFrequency(freq);
        job.setSalaryHidden(req.isSalaryHidden());
        job.setRequiredSkills(TextUtils.normalizeTokens(req.getRequiredSkills()));
        job.setKeywords(TextUtils.normalizeTokens(req.getKeywords()));
        job.setStatus(req.getStatus());
        job.setAttachmentUrl(req.getAttachmentUrl() == null ? "" : req.getAttachmentUrl().trim());
        job.setAttachmentName(req.getAttachmentName() == null ? "" : req.getAttachmentName().trim());
        jobPostingRepository.save(job);

        activityService.log(
                recruiterUserId,
                ActivityType.JOB_CREATED,
                "New job posted: " + job.getTitle(),
                job.getId(),
                null);

        return toJobDto(job);
    }

    @Transactional
    public RecruiterJobResponse updateJob(Long recruiterUserId, Long jobId, JobUpsertRequest req) {
        ensureRecruiterApproved(recruiterUserId);
        int minCtc = Math.max(0, req.getMinCtc());
        int maxCtc = Math.max(0, req.getMaxCtc());
        if (minCtc <= 0 || maxCtc <= 0 || minCtc > maxCtc) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please enter valid salary range");
        }
        String currency = (req.getCtcCurrency() == null) ? "INR" : req.getCtcCurrency().trim().toUpperCase();
        String freq = (req.getCtcFrequency() == null) ? "YEARLY" : req.getCtcFrequency().trim().toUpperCase();
        if (!freq.equals("YEARLY") && !freq.equals("MONTHLY")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid salary frequency");
        }
        var job =
                jobPostingRepository
                        .findByIdAndRecruiterUserId(jobId, recruiterUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Job not found"));
        job.setTitle(req.getTitle().trim());
        job.setDescription(req.getDescription() == null ? "" : req.getDescription().trim());
        job.setMinExperienceYears(Math.max(0, req.getMinExperienceYears()));
        job.setMinCtc(minCtc);
        job.setMaxCtc(maxCtc);
        job.setCtcCurrency(currency);
        job.setCtcFrequency(freq);
        job.setSalaryHidden(req.isSalaryHidden());
        job.setRequiredSkills(TextUtils.normalizeTokens(req.getRequiredSkills()));
        job.setKeywords(TextUtils.normalizeTokens(req.getKeywords()));
        job.setStatus(req.getStatus());
        job.setAttachmentUrl(req.getAttachmentUrl() == null ? "" : req.getAttachmentUrl().trim());
        job.setAttachmentName(req.getAttachmentName() == null ? "" : req.getAttachmentName().trim());
        jobPostingRepository.save(job);

        activityService.log(
                recruiterUserId,
                ActivityType.JOB_EDITED,
                "Job updated: " + job.getTitle(),
                job.getId(),
                null);

        return toJobDto(job);
    }

    @Transactional
    public void deleteJob(Long recruiterUserId, Long jobId) {
        ensureRecruiterApproved(recruiterUserId);
        var job =
                jobPostingRepository
                        .findByIdAndRecruiterUserId(jobId, recruiterUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Job not found"));
        String title = job.getTitle();
        jobPostingRepository.delete(job);

        activityService.log(
                recruiterUserId,
                ActivityType.JOB_DELETED,
                "Job deleted: " + (title == null ? "Job" : title),
                jobId,
                null);
    }

    @Transactional(readOnly = true)
    public List<MatchedCandidateResponse> matchedCandidates(Long recruiterUserId, Long jobId) {
        ensureRecruiterApproved(recruiterUserId);
        var job =
                jobPostingRepository
                        .findByIdAndRecruiterUserId(jobId, recruiterUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Job not found"));

        return candidateProfileRepository.findAll().stream()
                .map(
                        candidate -> {
                            var user = candidate.getUser();
                            var score = matchingService.score(candidate, job);
                            var appOpt =
                                    jobApplicationRepository.findByCandidateUserIdAndJobId(
                                            user.getId(), job.getId());
                            return MatchedCandidateResponse.builder()
                                    .candidateUserId(user.getId())
                                    .candidateEmail(user.getEmail())
                                    .fullName(candidate.getFullName())
                                    .experienceYears(candidate.getExperienceYears())
                                    .phone(candidate.getPhone())
                                    .education(candidate.getEducation())
                                    .professionalSummary(candidate.getProfessionalSummary())
                                    .profilePhotoDataUrl(candidate.getProfilePhotoDataUrl())
                                    .resumeUrl(candidate.getResumeUrl())
                                    .applicationId(appOpt.map(a -> a.getId()).orElse(null))
                                    .applicationStatus(appOpt.map(a -> a.getStatus()).orElse(null))
                                    .skills(candidate.getSkills())
                                    .keywords(candidate.getKeywords())
                                    .matchScorePercent(score.getPercentScore())
                                    .exactSkillMatches(score.getExactSkillMatches())
                                    .keywordMatches(score.getKeywordMatches())
                                    .build();
                        })
                .filter(m -> m.getExactSkillMatches() > 0 || m.getKeywordMatches() > 0)
                .sorted(Comparator.comparingInt(MatchedCandidateResponse::getMatchScorePercent).reversed())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RecruiterApplicationResponse> applicationsForJob(Long recruiterUserId, Long jobId) {
        ensureRecruiterApproved(recruiterUserId);
        var job =
                jobPostingRepository
                        .findByIdAndRecruiterUserId(jobId, recruiterUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Job not found"));

        return jobApplicationRepository.findByJobIdOrderByAppliedAtDesc(job.getId()).stream()
                .map(
                        app -> {
                            var candidateProfile =
                                    candidateProfileRepository
                                            .findByUserId(app.getCandidateUser().getId())
                                            .orElse(null);
                            return RecruiterApplicationResponse.builder()
                                    .applicationId(app.getId())
                                    .candidateUserId(app.getCandidateUser().getId())
                                    .candidateEmail(app.getCandidateUser().getEmail())
                                    .candidateName(candidateProfile == null ? "" : candidateProfile.getFullName())
                                    .profilePhotoDataUrl(
                                            candidateProfile == null
                                                    ? ""
                                                    : candidateProfile.getProfilePhotoDataUrl())
                                    .resumeUrl(candidateProfile == null ? "" : candidateProfile.getResumeUrl())
                                    .status(app.getStatus())
                                    .appliedAt(app.getAppliedAt())
                                    .updatedAt(app.getUpdatedAt())
                                    .build();
                        })
                .toList();
    }

    @Transactional
    public void updateApplicationStatus(
            Long recruiterUserId, Long applicationId, com.jobportal.application.ApplicationStatus status) {
        ensureRecruiterApproved(recruiterUserId);
        var app =
                jobApplicationRepository
                        .findByIdAndJobRecruiterUserId(applicationId, recruiterUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Application not found"));
        app.setStatus(status);
        app.setUpdatedAt(Instant.now());
        jobApplicationRepository.save(app);

        // Side effects (notifications/activity) must never cause the core action to fail.
        // This prevents 500s from legacy/corrupted rows while still updating the status correctly.
        String jobTitle = "";
        Long jobId = null;
        Long candidateUserId = null;
        try {
            jobTitle = (app.getJob() == null || app.getJob().getTitle() == null) ? "" : app.getJob().getTitle();
            jobId = (app.getJob() == null) ? null : app.getJob().getId();
            candidateUserId = (app.getCandidateUser() == null) ? null : app.getCandidateUser().getId();
        } catch (Exception e) {
            log.warn(
                    "Failed to resolve job/candidate for applicationId={} recruiterUserId={}. Status update already saved.",
                    applicationId,
                    recruiterUserId,
                    e);
        }

        if (candidateUserId != null) {
            try {
                String safeTitle = jobTitle.isBlank() ? "the job" : jobTitle;
                String msg =
                        switch (status) {
                            case APPLIED -> "Your application was received for " + safeTitle;
                            case SHORTLISTED -> "You were shortlisted for " + safeTitle;
                            case TECHNICAL -> "You moved to technical round for " + safeTitle;
                            case FINAL_INTERVIEW -> "You moved to final interview for " + safeTitle;
                            case OFFER -> "You received an offer update for " + safeTitle;
                            case REJECTED -> "Your application was rejected for " + safeTitle;
                        };
                notificationService.notifyUser(
                        candidateUserId,
                        recruiterUserId,
                        NotificationType.APPLICATION_UPDATE,
                        "Application Update",
                        msg,
                        "/candidate-dashboard?page=applications");
            } catch (Exception e) {
                log.warn(
                        "Notification failed for applicationId={} recruiterUserId={} candidateUserId={}.",
                        applicationId,
                        recruiterUserId,
                        candidateUserId,
                        e);
            }
        }

        try {
            activityService.log(
                    recruiterUserId,
                    ActivityType.APPLICATION_STATUS_CHANGED,
                    "Candidate moved to " + status + (jobTitle.isBlank() ? "" : " for " + jobTitle),
                    jobId,
                    candidateUserId);
        } catch (Exception e) {
            log.warn("Activity log failed for applicationId={} recruiterUserId={}.", applicationId, recruiterUserId, e);
        }
    }

    @Transactional
    public void emailCandidate(Long recruiterUserId, Long applicationId, String subject, String message) {
        ensureRecruiterApproved(recruiterUserId);
        var app =
                jobApplicationRepository
                        .findByIdAndJobRecruiterUserId(applicationId, recruiterUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Application not found"));
        String to = app.getCandidateUser().getEmail();
        String body =
                "Regarding your application for: "
                        + app.getJob().getTitle()
                        + "\n\n"
                        + message
                        + "\n\n"
                        + "Regards,\nIT Job Portal Recruiter";
        emailService.send(to, subject, body);

        notificationService.notifyUser(
                app.getCandidateUser().getId(),
                recruiterUserId,
                NotificationType.RECRUITER_MESSAGE,
                "New Message from Recruiter",
                (subject == null || subject.isBlank())
                        ? "You received a message about " + app.getJob().getTitle()
                        : subject,
                "/candidate-dashboard?page=notifications");
    }

    @Transactional(readOnly = true)
    public List<RecruiterNotificationResponse> notifications(Long recruiterUserId) {
        ensureRecruiterApproved(recruiterUserId);
        return jobApplicationRepository.findTop50ByJobRecruiterUserIdOrderByUpdatedAtDesc(recruiterUserId).stream()
                .map(
                        app -> {
                            String email = app.getCandidateUser().getEmail();
                            String jobTitle = app.getJob().getTitle();
                            String type =
                                    switch (app.getStatus()) {
                                        case APPLIED -> "APPLICATION";
                                        case SHORTLISTED -> "SHORTLIST";
                                        case TECHNICAL -> "TECHNICAL";
                                        case FINAL_INTERVIEW -> "FINAL_INTERVIEW";
                                        case OFFER -> "OFFER";
                                        case REJECTED -> "REJECTION";
                                    };
                            String msg =
                                    switch (app.getStatus()) {
                                        case APPLIED -> email + " applied to " + jobTitle;
                                        case SHORTLISTED -> email + " shortlisted for " + jobTitle;
                                        case TECHNICAL -> email + " moved to technical for " + jobTitle;
                                        case FINAL_INTERVIEW -> email + " moved to final interview for " + jobTitle;
                                        case OFFER -> email + " moved to offer for " + jobTitle;
                                        case REJECTED -> email + " rejected for " + jobTitle;
                                    };
                            return RecruiterNotificationResponse.builder()
                                    .type(type)
                                    .message(msg)
                                    .createdAt(app.getUpdatedAt())
                                    .build();
                        })
                .toList();
    }

    private static RecruiterJobResponse toJobDto(JobPosting job) {
        return RecruiterJobResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .description(job.getDescription())
                .minExperienceYears(job.getMinExperienceYears())
                .minCtc(job.getMinCtc())
                .maxCtc(job.getMaxCtc())
                .ctcCurrency(job.getCtcCurrency())
                .ctcFrequency(job.getCtcFrequency())
                .salaryHidden(job.isSalaryHidden())
                .requiredSkills(job.getRequiredSkills())
                .keywords(job.getKeywords())
                .status(job.getStatus())
                .attachmentUrl(job.getAttachmentUrl())
                .attachmentName(job.getAttachmentName())
                .createdAt(job.getCreatedAt())
                .build();
    }

    public com.jobportal.user.User ensureRecruiterApproved(Long recruiterUserId) {
        var user =
                userRepository
                        .findById(recruiterUserId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getRole() != Role.RECRUITER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a recruiter user");
        }
        if (!user.isRecruiterApproved()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Recruiter not approved by admin yet");
        }
        return user;
    }
}
