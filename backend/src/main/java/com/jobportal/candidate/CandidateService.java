package com.jobportal.candidate;

import com.jobportal.application.JobApplication;
import com.jobportal.application.JobApplicationRepository;
import com.jobportal.candidate.dto.ApplicationResponse;
import com.jobportal.candidate.dto.CandidateApplicationDetailResponse;
import com.jobportal.candidate.dto.CandidateProfileRequest;
import com.jobportal.candidate.dto.CandidateProfileResponse;
import com.jobportal.candidate.dto.CandidateCertificateResponse;
import com.jobportal.candidate.dto.MatchedJobResponse;
import com.jobportal.common.TextUtils;
import com.jobportal.common.FileStorageService;
import com.jobportal.job.JobPostingRepository;
import com.jobportal.job.JobStatus;
import com.jobportal.matching.MatchingService;
import com.jobportal.notification.NotificationService;
import com.jobportal.notification.NotificationType;
import com.jobportal.activity.ActivityService;
import com.jobportal.activity.ActivityType;
import com.jobportal.recruiter.RecruiterProfileRepository;
import com.jobportal.user.Role;
import com.jobportal.user.UserRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.Map;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CandidateService {
    private final CandidateProfileRepository candidateProfileRepository;
    private final UserRepository userRepository;
    private final JobPostingRepository jobPostingRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final MatchingService matchingService;
    private final RecruiterProfileRepository recruiterProfileRepository;
    private final NotificationService notificationService;
    private final ActivityService activityService;
    private final CandidateCertificateRepository candidateCertificateRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public CandidateProfileResponse getProfile(Long candidateUserId) {
        var profile =
                candidateProfileRepository
                        .findByUserId(candidateUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Candidate profile not found"));
        var user =
                userRepository
                        .findById(candidateUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "User not found"));
        if (user.getRole() != Role.CANDIDATE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a candidate user");
        }

        return CandidateProfileResponse.builder()
                .id(profile.getId())
                .email(user.getEmail())
                .fullName(profile.getFullName())
                .roleTitle(profile.getRoleTitle())
                .location(profile.getLocation())
                .phone(profile.getPhone())
                .education(profile.getEducation())
                .professionalSummary(profile.getProfessionalSummary())
                .profilePhotoDataUrl(profile.getProfilePhotoDataUrl())
                .resumeUrl(profile.getResumeUrl())
                .experienceYears(profile.getExperienceYears())
                .skills(profile.getSkills())
                .keywords(profile.getKeywords())
                .build();
    }

    @Transactional
    public CandidateProfileResponse upsertProfile(Long candidateUserId, CandidateProfileRequest req) {
        var profile =
                candidateProfileRepository
                        .findByUserId(candidateUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Candidate profile not found"));
        profile.setFullName(req.getFullName().trim());
        profile.setPhone(req.getPhone().trim());
        profile.setEducation(req.getEducation() == null ? "" : req.getEducation().trim());
        profile.setRoleTitle(req.getRoleTitle() == null ? "" : req.getRoleTitle().trim());
        profile.setLocation(req.getLocation() == null ? "" : req.getLocation().trim());
        profile.setProfessionalSummary(
                req.getProfessionalSummary() == null ? "" : req.getProfessionalSummary().trim());
        profile.setProfilePhotoDataUrl(req.getProfilePhotoDataUrl() == null ? "" : req.getProfilePhotoDataUrl().trim());
        profile.setExperienceYears(Math.max(0, req.getExperienceYears()));
        profile.setSkills(TextUtils.normalizeTokens(req.getSkills()));
        profile.setKeywords(TextUtils.normalizeTokens(req.getKeywords()));
        candidateProfileRepository.save(profile);
        return getProfile(candidateUserId);
    }

    @Transactional
    public String uploadResume(Long candidateUserId, String resumeUrl) {
        var profile =
                candidateProfileRepository
                        .findByUserId(candidateUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Candidate profile not found"));
        profile.setResumeUrl(resumeUrl == null ? "" : resumeUrl.trim());
        candidateProfileRepository.save(profile);
        return profile.getResumeUrl();
    }

    @Transactional(readOnly = true)
    public List<MatchedJobResponse> matchedJobs(Long candidateUserId) {
        var profile =
                candidateProfileRepository
                        .findByUserId(candidateUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Candidate profile not found"));

        var jobs = jobPostingRepository.findActiveWithRecruiterUser(JobStatus.ACTIVE);
        var recruiterIds = jobs.stream().map(j -> j.getRecruiterUser().getId()).distinct().toList();
        Map<Long, String> companyByUserId =
                recruiterProfileRepository.findByUserIdIn(recruiterIds).stream()
                        .collect(
                                java.util.stream.Collectors.toMap(
                                        rp -> rp.getUserId(), rp -> rp.getCompanyName()));

        return jobs.stream()
                .map(
                        job -> {
                            var score = matchingService.score(profile, job);
                            return MatchedJobResponse.builder()
                                    .id(job.getId())
                                    .recruiterUserId(job.getRecruiterUser().getId())
                                    .companyName(companyByUserId.getOrDefault(job.getRecruiterUser().getId(), ""))
                                    .recruiterEmail(job.getRecruiterUser().getEmail())
                                    .title(job.getTitle())
                                    .description(job.getDescription())
                                    .minExperienceYears(job.getMinExperienceYears())
                                    .minCtc(job.getMinCtc())
                                    .maxCtc(job.getMaxCtc())
                                    .ctcCurrency(job.getCtcCurrency())
                                    .ctcFrequency(job.getCtcFrequency())
                                    .salaryHidden(job.isSalaryHidden())
                                    .matchScorePercent(score.getPercentScore())
                                    .exactSkillMatches(score.getExactSkillMatches())
                                    .keywordMatches(score.getKeywordMatches())
                                    .status(job.getStatus())
                                    .createdAt(job.getCreatedAt())
                                    .build();
                        })
                .filter(m -> m.getExactSkillMatches() > 0 || m.getKeywordMatches() > 0)
                .sorted(Comparator.comparingInt(MatchedJobResponse::getMatchScorePercent).reversed())
                .toList();
    }

    @Transactional
    public void apply(Long candidateUserId, Long jobId) {
        if (jobApplicationRepository.existsByCandidateUserIdAndJobId(candidateUserId, jobId)) {
            return;
        }
        var job =
                jobPostingRepository
                        .findById(jobId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Job not found"));
        if (job.getStatus() != JobStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Job is not open");
        }

        var user =
                userRepository
                        .findById(candidateUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "User not found"));
        if (user.getRole() != Role.CANDIDATE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only candidates can apply");
        }

        var app = new JobApplication();
        app.setCandidateUser(user);
        app.setJob(job);
        app.setAppliedAt(Instant.now());
        app.setUpdatedAt(Instant.now());
        jobApplicationRepository.save(app);

        // Notify recruiter about the new application (unified notifications).
        notificationService.notifyUser(
                job.getRecruiterUser().getId(),
                candidateUserId,
                NotificationType.NEW_APPLICATION,
                "New Candidate Applied",
                user.getEmail() + " applied to " + job.getTitle(),
                "/recruiter-dashboard?section=candidates&jobId=" + job.getId());

        activityService.log(
                job.getRecruiterUser().getId(),
                ActivityType.CANDIDATE_APPLIED,
                "New application for " + job.getTitle(),
                job.getId(),
                candidateUserId);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> applications(Long candidateUserId) {
        var apps = jobApplicationRepository.findByCandidateUserIdOrderByAppliedAtDesc(candidateUserId);
        Set<Long> recruiterIds = apps.stream().map(a -> a.getJob().getRecruiterUser().getId()).collect(java.util.stream.Collectors.toSet());
        Map<Long, String> companyByUserId =
                recruiterProfileRepository.findByUserIdIn(recruiterIds).stream()
                        .collect(
                                java.util.stream.Collectors.toMap(
                                        rp -> rp.getUserId(), rp -> rp.getCompanyName()));

        return apps.stream()
                .map(
                        app ->
                                ApplicationResponse.builder()
                                        .id(app.getId())
                                        .jobId(app.getJob().getId())
                                        .jobTitle(app.getJob().getTitle())
                                        .companyName(
                                                companyByUserId.getOrDefault(
                                                        app.getJob().getRecruiterUser().getId(), ""))
                                        .status(app.getStatus())
                                        .appliedAt(app.getAppliedAt())
                                        .updatedAt(app.getUpdatedAt())
                                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public CandidateApplicationDetailResponse applicationDetail(Long candidateUserId, Long applicationId) {
        var app =
                jobApplicationRepository
                        .findByIdAndCandidateUserId(applicationId, candidateUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Application not found"));

        var job = app.getJob();
        Long recruiterId = job.getRecruiterUser().getId();
        String companyName =
                recruiterProfileRepository
                        .findByUserId(recruiterId)
                        .map(rp -> rp.getCompanyName())
                        .orElse("");

        return CandidateApplicationDetailResponse.builder()
                .id(app.getId())
                .status(app.getStatus())
                .appliedAt(app.getAppliedAt())
                .updatedAt(app.getUpdatedAt())
                .jobId(job.getId())
                .jobTitle(job.getTitle())
                .jobDescription(job.getDescription())
                .minExperienceYears(job.getMinExperienceYears())
                .minCtc(job.getMinCtc())
                .maxCtc(job.getMaxCtc())
                .ctcCurrency(job.getCtcCurrency())
                .ctcFrequency(job.getCtcFrequency())
                .salaryHidden(job.isSalaryHidden())
                .requiredSkills(job.getRequiredSkills().stream().toList())
                .keywords(job.getKeywords().stream().toList())
                .recruiterUserId(recruiterId)
                .recruiterEmail(job.getRecruiterUser().getEmail())
                .companyName(companyName)
                .build();
    }

    @Transactional(readOnly = true)
    public List<CandidateCertificateResponse> certificates(Long candidateUserId) {
        return candidateCertificateRepository.findByCandidateUserIdOrderByUploadedAtDesc(candidateUserId).stream()
                .map(
                        c ->
                                CandidateCertificateResponse.builder()
                                        .id(c.getId())
                                        .fileUrl(c.getFileUrl())
                                        .originalName(c.getOriginalName())
                                        .contentType(c.getContentType())
                                        .sizeBytes(c.getSizeBytes())
                                        .uploadedAt(c.getUploadedAt())
                                        .build())
                .toList();
    }

    @Transactional
    public List<CandidateCertificateResponse> uploadCertificates(
            Long candidateUserId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No files uploaded");
        }

        var user =
                userRepository
                        .findById(candidateUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "User not found"));
        if (user.getRole() != Role.CANDIDATE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only candidates can upload certificates");
        }

        for (MultipartFile f : files) {
            var stored = fileStorageService.storeCandidateCertificate(candidateUserId, f);
            var cert = new CandidateCertificate();
            cert.setCandidateUser(user);
            cert.setFileUrl(stored.url());
            cert.setStoredName(stored.storedName());
            cert.setOriginalName((f.getOriginalFilename() == null) ? "certificate" : f.getOriginalFilename());
            cert.setContentType((f.getContentType() == null) ? "" : f.getContentType());
            cert.setSizeBytes(f.getSize());
            cert.setUploadedAt(Instant.now());
            candidateCertificateRepository.save(cert);
        }
        return certificates(candidateUserId);
    }

    @Transactional
    public void deleteCertificate(Long candidateUserId, Long certificateId) {
        var cert =
                candidateCertificateRepository
                        .findByIdAndCandidateUserId(certificateId, candidateUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Certificate not found"));
        fileStorageService.deleteUploadByUrl(cert.getFileUrl());
        candidateCertificateRepository.delete(cert);
    }
}
