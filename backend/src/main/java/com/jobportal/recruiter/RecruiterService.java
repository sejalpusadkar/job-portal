package com.jobportal.recruiter;

import com.jobportal.application.JobApplicationRepository;
import com.jobportal.candidate.CandidateProfileRepository;
import com.jobportal.common.TextUtils;
import com.jobportal.job.JobPosting;
import com.jobportal.job.JobPostingRepository;
import com.jobportal.mail.EmailService;
import com.jobportal.matching.MatchingService;
import com.jobportal.recruiter.dto.JobUpsertRequest;
import com.jobportal.recruiter.dto.MatchedCandidateResponse;
import com.jobportal.recruiter.dto.RecruiterApplicationResponse;
import com.jobportal.recruiter.dto.RecruiterJobResponse;
import com.jobportal.user.Role;
import com.jobportal.user.UserRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class RecruiterService {
    private final UserRepository userRepository;
    private final JobPostingRepository jobPostingRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final MatchingService matchingService;
    private final EmailService emailService;

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

        var job = new JobPosting();
        job.setRecruiterUser(recruiter);
        job.setTitle(req.getTitle().trim());
        job.setDescription(req.getDescription() == null ? "" : req.getDescription().trim());
        job.setMinExperienceYears(Math.max(0, req.getMinExperienceYears()));
        job.setRequiredSkills(TextUtils.normalizeTokens(req.getRequiredSkills()));
        job.setKeywords(TextUtils.normalizeTokens(req.getKeywords()));
        job.setStatus(req.getStatus());
        jobPostingRepository.save(job);
        return toJobDto(job);
    }

    @Transactional
    public RecruiterJobResponse updateJob(Long recruiterUserId, Long jobId, JobUpsertRequest req) {
        ensureRecruiterApproved(recruiterUserId);
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
        job.setRequiredSkills(TextUtils.normalizeTokens(req.getRequiredSkills()));
        job.setKeywords(TextUtils.normalizeTokens(req.getKeywords()));
        job.setStatus(req.getStatus());
        jobPostingRepository.save(job);
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
        jobPostingRepository.delete(job);
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
    }

    private static RecruiterJobResponse toJobDto(JobPosting job) {
        return RecruiterJobResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .description(job.getDescription())
                .minExperienceYears(job.getMinExperienceYears())
                .requiredSkills(job.getRequiredSkills())
                .keywords(job.getKeywords())
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .build();
    }

    private com.jobportal.user.User ensureRecruiterApproved(Long recruiterUserId) {
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
