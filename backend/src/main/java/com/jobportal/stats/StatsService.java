package com.jobportal.stats;

import com.jobportal.application.JobApplicationRepository;
import com.jobportal.interview.InterviewRepository;
import com.jobportal.interview.InterviewStatus;
import com.jobportal.job.JobPostingRepository;
import com.jobportal.job.JobStatus;
import com.jobportal.notification.NotificationRepository;
import com.jobportal.stats.dto.CandidateStatsResponse;
import com.jobportal.stats.dto.RecruiterStatsResponse;
import com.jobportal.user.Role;
import com.jobportal.user.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatsService {
    private static final Duration STALE_AFTER = Duration.ofHours(24);

    private final UserRepository userRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final InterviewRepository interviewRepository;
    private final JobPostingRepository jobPostingRepository;
    private final NotificationRepository notificationRepository;
    private final CandidateStatsRepository candidateStatsRepository;
    private final RecruiterStatsRepository recruiterStatsRepository;

    @Transactional
    public void refreshAll() {
        var users = userRepository.findAll();
        users.stream().filter(u -> u.getRole() == Role.CANDIDATE).forEach(u -> refreshCandidate(u.getId()));
        users.stream().filter(u -> u.getRole() == Role.RECRUITER).forEach(u -> refreshRecruiter(u.getId()));
    }

    @Transactional
    public CandidateStatsResponse getCandidateStats(Long userId) {
        CandidateStats stats =
                candidateStatsRepository
                        .findByUserId(userId)
                        .orElseGet(
                                () -> {
                                    CandidateStats s = new CandidateStats();
                                    s.setUserId(userId);
                                    return s;
                                });
        if (stats.getUpdatedAt() == null
                || stats.getUpdatedAt().isBefore(Instant.now().minus(STALE_AFTER))) {
            stats = refreshCandidate(userId);
        }
        return CandidateStatsResponse.builder()
                .applicationsCount(stats.getApplicationsCount())
                .interviewsCount(stats.getInterviewsCount())
                .profileViewsCount(stats.getProfileViewsCount())
                .updatedAt(stats.getUpdatedAt())
                .build();
    }

    @Transactional
    public RecruiterStatsResponse getRecruiterStats(Long userId) {
        RecruiterStats stats =
                recruiterStatsRepository
                        .findByUserId(userId)
                        .orElseGet(
                                () -> {
                                    RecruiterStats s = new RecruiterStats();
                                    s.setUserId(userId);
                                    return s;
                                });
        if (stats.getUpdatedAt() == null
                || stats.getUpdatedAt().isBefore(Instant.now().minus(STALE_AFTER))) {
            stats = refreshRecruiter(userId);
        }
        return RecruiterStatsResponse.builder()
                .activeJobsCount(stats.getActiveJobsCount())
                .totalApplicantsCount(stats.getTotalApplicantsCount())
                .interviewsScheduledCount(stats.getInterviewsScheduledCount())
                .updatedAt(stats.getUpdatedAt())
                .build();
    }

    @Transactional
    public CandidateStats refreshCandidate(Long userId) {
        CandidateStats stats = candidateStatsRepository.findByUserId(userId).orElseGet(CandidateStats::new);
        stats.setUserId(userId);
        stats.setApplicationsCount(jobApplicationRepository.countByCandidateUserId(userId));
        stats.setInterviewsCount(interviewRepository.countByCandidateUserIdAndStatus(userId, InterviewStatus.SCHEDULED));
        stats.setProfileViewsCount(notificationRepository.countByRecipientUserIdAndType(userId, "PROFILE_VIEWED"));
        stats.setUpdatedAt(Instant.now());
        return candidateStatsRepository.save(stats);
    }

    @Transactional
    public RecruiterStats refreshRecruiter(Long userId) {
        RecruiterStats stats = recruiterStatsRepository.findByUserId(userId).orElseGet(RecruiterStats::new);
        stats.setUserId(userId);
        stats.setActiveJobsCount(jobPostingRepository.countByRecruiterUserIdAndStatus(userId, JobStatus.ACTIVE));
        stats.setTotalApplicantsCount(jobApplicationRepository.countByJobRecruiterUserId(userId));
        stats.setInterviewsScheduledCount(interviewRepository.countByRecruiterUserIdAndStatus(userId, InterviewStatus.SCHEDULED));
        stats.setUpdatedAt(Instant.now());
        return recruiterStatsRepository.save(stats);
    }
}

