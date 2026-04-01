package com.jobportal.recruiter;

import com.jobportal.job.JobPostingRepository;
import com.jobportal.job.JobStatus;
import com.jobportal.job.dto.JobResponse;
import com.jobportal.notification.NotificationService;
import com.jobportal.notification.NotificationType;
import com.jobportal.post.PostService;
import com.jobportal.post.dto.PostResponse;
import com.jobportal.security.UserPrincipal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/recruiters")
@RequiredArgsConstructor
public class RecruiterPublicController {
    private final RecruiterProfileService recruiterProfileService;
    private final JobPostingRepository jobPostingRepository;
    private final PostService postService;
    private final NotificationService notificationService;

    @GetMapping("/{recruiterUserId}/profile")
    public com.jobportal.recruiter.dto.RecruiterProfileResponse profile(
            Authentication auth, @PathVariable Long recruiterUserId) {
        Long viewerUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        var profile = recruiterProfileService.getProfile(recruiterUserId);
        if (profile == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Recruiter profile not found");
        }

        // Notify recruiter that someone viewed their profile (de-duped in NotificationService).
        notificationService.notifyUser(
                recruiterUserId,
                viewerUserId,
                NotificationType.PROFILE_VIEWED,
                "Profile Viewed",
                "Someone viewed your recruiter profile",
                "/recruiter-dashboard?section=dashboard");

        return profile;
    }

    @GetMapping("/{recruiterUserId}/jobs")
    public List<JobResponse> activeJobs(@PathVariable Long recruiterUserId) {
        String companyName =
                recruiterProfileService
                        .getProfile(recruiterUserId) == null
                        ? ""
                        : (recruiterProfileService.getProfile(recruiterUserId).getCompanyName() == null
                                ? ""
                                : recruiterProfileService.getProfile(recruiterUserId).getCompanyName());
        return jobPostingRepository.findByRecruiterUserIdOrderByCreatedAtDesc(recruiterUserId).stream()
                .filter(j -> j.getStatus() == JobStatus.ACTIVE)
                .map(
                        j ->
                                JobResponse.builder()
                                        .id(j.getId())
                                        .recruiterUserId(recruiterUserId)
                                        .companyName(companyName)
                                        .recruiterEmail(j.getRecruiterUser().getEmail())
                                        .title(j.getTitle())
                                        .description(j.getDescription())
                                        .minExperienceYears(j.getMinExperienceYears())
                                        .minCtc(j.getMinCtc())
                                        .maxCtc(j.getMaxCtc())
                                        .ctcCurrency(j.getCtcCurrency())
                                        .ctcFrequency(j.getCtcFrequency())
                                        .salaryHidden(j.isSalaryHidden())
                                        .requiredSkills(j.getRequiredSkills())
                                        .keywords(j.getKeywords())
                                        .status(j.getStatus())
                                        .createdAt(j.getCreatedAt())
                                        .build())
                .toList();
    }

    @GetMapping("/{recruiterUserId}/posts")
    public List<PostResponse> recruiterPosts(Authentication auth, @PathVariable Long recruiterUserId) {
        Long viewerUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        return postService.recruiterPosts(recruiterUserId, viewerUserId);
    }
}
