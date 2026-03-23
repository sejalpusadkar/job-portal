package com.jobportal.candidate;

import com.jobportal.application.JobApplication;
import com.jobportal.application.JobApplicationRepository;
import com.jobportal.candidate.dto.ApplicationResponse;
import com.jobportal.candidate.dto.CandidateProfileRequest;
import com.jobportal.candidate.dto.CandidateProfileResponse;
import com.jobportal.candidate.dto.MatchedJobResponse;
import com.jobportal.common.TextUtils;
import com.jobportal.job.JobPostingRepository;
import com.jobportal.job.JobStatus;
import com.jobportal.matching.MatchingService;
import com.jobportal.recruiter.RecruiterProfileRepository;
import com.jobportal.user.Role;
import com.jobportal.user.UserRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.Map;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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
                                    .companyName(companyByUserId.getOrDefault(job.getRecruiterUser().getId(), ""))
                                    .recruiterEmail(job.getRecruiterUser().getEmail())
                                    .title(job.getTitle())
                                    .description(job.getDescription())
                                    .minExperienceYears(job.getMinExperienceYears())
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
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> applications(Long candidateUserId) {
        return jobApplicationRepository.findByCandidateUserIdOrderByAppliedAtDesc(candidateUserId).stream()
                .map(
                        app ->
                                ApplicationResponse.builder()
                                        .id(app.getId())
                                        .jobId(app.getJob().getId())
                                        .jobTitle(app.getJob().getTitle())
                                        .status(app.getStatus())
                                        .appliedAt(app.getAppliedAt())
                                        .updatedAt(app.getUpdatedAt())
                                        .build())
                .toList();
    }
}
