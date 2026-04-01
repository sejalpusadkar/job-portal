package com.jobportal.admin;

import com.jobportal.admin.dto.AdminMetricsResponse;
import com.jobportal.admin.dto.AdminApplicationResponse;
import com.jobportal.admin.dto.AdminJobResponse;
import com.jobportal.admin.dto.AdminUserResponse;
import com.jobportal.admin.dto.PendingRecruiterResponse;
import com.jobportal.application.JobApplicationRepository;
import com.jobportal.job.JobPostingRepository;
import com.jobportal.candidate.CandidateProfileRepository;
import com.jobportal.post.CandidatePostRepository;
import com.jobportal.post.RecruiterPostRepository;
import com.jobportal.notification.NotificationRepository;
import com.jobportal.interview.InterviewRepository;
import com.jobportal.activity.ActivityRepository;
import com.jobportal.recruiter.RecruiterProfileRepository;
import com.jobportal.user.Role;
import com.jobportal.user.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AdminService {
    private final UserRepository userRepository;
    private final RecruiterProfileRepository recruiterProfileRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final JobPostingRepository jobPostingRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final CandidatePostRepository candidatePostRepository;
    private final RecruiterPostRepository recruiterPostRepository;
    private final NotificationRepository notificationRepository;
    private final InterviewRepository interviewRepository;
    private final ActivityRepository activityRepository;

    @Transactional(readOnly = true)
    public List<PendingRecruiterResponse> pendingRecruiters() {
        return userRepository.findByRoleAndRecruiterApprovedFalseAndEnabledTrue(Role.RECRUITER).stream()
                .map(
                        u -> {
                            var rp = recruiterProfileRepository.findByUserId(u.getId()).orElse(null);
                            return PendingRecruiterResponse.builder()
                                    .userId(u.getId())
                                    .email(u.getEmail())
                                    .companyName(rp == null ? "" : rp.getCompanyName())
                                    .contactPerson(rp == null ? "" : rp.getContactPerson())
                                    .phone(rp == null ? "" : rp.getPhone())
                                    .createdAt(u.getCreatedAt())
                                    .build();
                        })
                .toList();
    }

    @Transactional
    public void approveRecruiter(Long recruiterUserId) {
        var u =
                userRepository
                        .findById(recruiterUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Recruiter not found"));
        if (u.getRole() != Role.RECRUITER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a recruiter");
        }
        u.setRecruiterApproved(true);
        userRepository.save(u);
    }

    @Transactional
    public void rejectRecruiter(Long recruiterUserId) {
        var u =
                userRepository
                        .findById(recruiterUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Recruiter not found"));
        if (u.getRole() != Role.RECRUITER) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a recruiter");
        }
        // Safer than deleting rows with foreign keys: disable the account.
        u.setEnabled(false);
        userRepository.save(u);
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> users() {
        return userRepository.findAll().stream()
                .map(
                        u ->
                                AdminUserResponse.builder()
                                        .id(u.getId())
                                        .email(u.getEmail())
                                        .role(u.getRole())
                                        .enabled(u.isEnabled())
                                        .recruiterApproved(u.isRecruiterApproved())
                                        .createdAt(u.getCreatedAt())
                                        .build())
                .toList();
    }

    @Transactional
    public void deleteUser(Long userId) {
        var u = userRepository.findById(userId).orElse(null);
        if (u == null) return;
        // Hard delete with cleanup so UI instantly reflects changes and avoids FK issues.
        // This is admin-only.
        try {
            // Candidate-specific cleanup
            candidateProfileRepository.findByUserId(userId).ifPresent(candidateProfileRepository::delete);
            candidatePostRepository.findTop50ByCandidateUserIdOrderByCreatedAtDesc(userId).forEach(candidatePostRepository::delete);
            interviewRepository.findByCandidateUserIdOrderByScheduledAtAsc(userId).forEach(interviewRepository::delete);

            // Recruiter-specific cleanup
            recruiterProfileRepository.findByUserId(userId).ifPresent(recruiterProfileRepository::delete);
            recruiterPostRepository.findTop50ByRecruiterUserIdOrderByCreatedAtDesc(userId).forEach(recruiterPostRepository::delete);
            interviewRepository.findByRecruiterUserIdOrderByScheduledAtAsc(userId).forEach(interviewRepository::delete);

            // Applications (both sides)
            jobApplicationRepository.findByCandidateUserIdOrderByAppliedAtDesc(userId).forEach(jobApplicationRepository::delete);
            jobPostingRepository.findByRecruiterUserIdOrderByCreatedAtDesc(userId).forEach(jobPostingRepository::delete);

            // Notifications
            notificationRepository.findTop100ByRecipientUserIdOrderByCreatedAtDesc(userId).forEach(notificationRepository::delete);

            // Activities owned by recruiter
            activityRepository.deleteByRecruiterUserId(userId);
        } catch (Exception ignored) {
            // If cleanup fails, fall back to disabling the user.
            u.setEnabled(false);
            userRepository.save(u);
            return;
        }

        userRepository.delete(u);
    }

    @Transactional(readOnly = true)
    public AdminMetricsResponse metrics() {
        long totalUsers = userRepository.count();
        long totalCandidates = userRepository.findAll().stream().filter(u -> u.getRole() == Role.CANDIDATE).count();
        long totalRecruiters = userRepository.findAll().stream().filter(u -> u.getRole() == Role.RECRUITER).count();
        long pendingRecruiters = userRepository.findByRoleAndRecruiterApprovedFalseAndEnabledTrue(Role.RECRUITER).size();
        long totalJobs = jobPostingRepository.count();
        long totalApplications = jobApplicationRepository.count();
        return AdminMetricsResponse.builder()
                .totalUsers(totalUsers)
                .totalCandidates(totalCandidates)
                .totalRecruiters(totalRecruiters)
                .pendingRecruiters(pendingRecruiters)
                .totalJobs(totalJobs)
                .totalApplications(totalApplications)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AdminJobResponse> jobs(int limit) {
        return jobPostingRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(Math.max(1, limit))
                .map(
                        j ->
                                AdminJobResponse.builder()
                                        .id(j.getId())
                                        .title(j.getTitle())
                                        .recruiterEmail(j.getRecruiterUser().getEmail())
                                        .status(j.getStatus())
                                        .createdAt(j.getCreatedAt())
                                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminApplicationResponse> applications(int limit) {
        return jobApplicationRepository.findAll().stream()
                .sorted((a, b) -> b.getAppliedAt().compareTo(a.getAppliedAt()))
                .limit(Math.max(1, limit))
                .map(
                        a ->
                                AdminApplicationResponse.builder()
                                        .id(a.getId())
                                        .jobId(a.getJob().getId())
                                        .jobTitle(a.getJob().getTitle())
                                        .candidateEmail(a.getCandidateUser().getEmail())
                                        .status(a.getStatus())
                                        .appliedAt(a.getAppliedAt())
                                        .updatedAt(a.getUpdatedAt())
                                        .build())
                .toList();
    }
}
