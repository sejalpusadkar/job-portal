package com.jobportal.recruiter;

import com.jobportal.recruiter.dto.JobUpsertRequest;
import com.jobportal.recruiter.dto.MatchedCandidateResponse;
import com.jobportal.recruiter.dto.RecruiterApplicationResponse;
import com.jobportal.recruiter.dto.RecruiterJobResponse;
import com.jobportal.recruiter.dto.RecruiterProfileRequest;
import com.jobportal.recruiter.dto.RecruiterProfileResponse;
import com.jobportal.recruiter.dto.RecruiterNotificationResponse;
import com.jobportal.recruiter.dto.SendEmailRequest;
import com.jobportal.recruiter.dto.UpdateApplicationStatusRequest;
import com.jobportal.recruiter.dto.UploadJobAttachmentResponse;
import com.jobportal.recruiter.dto.UploadRecruiterPhotoResponse;
import com.jobportal.common.FileStorageService;
import com.jobportal.candidate.CandidateService;
import com.jobportal.candidate.dto.CandidateProfileResponse;
import com.jobportal.notification.NotificationService;
import com.jobportal.notification.NotificationType;
import com.jobportal.post.PostService;
import com.jobportal.post.dto.PostResponse;
import com.jobportal.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/recruiter")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated() and authentication.principal.recruiterApproved == true")
public class RecruiterController {
    private final RecruiterService recruiterService;
    private final RecruiterProfileService recruiterProfileService;
    private final FileStorageService fileStorageService;
    private final PostService postService;
    private final CandidateService candidateService;
    private final NotificationService notificationService;

    @GetMapping("/profile")
    public RecruiterProfileResponse profile(Authentication auth) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        return recruiterProfileService.getProfile(recruiterUserId);
    }

    @PutMapping("/profile")
    public RecruiterProfileResponse updateProfile(
            Authentication auth, @Valid @RequestBody RecruiterProfileRequest req) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        return recruiterProfileService.upsert(recruiterUserId, req);
    }

    @PostMapping(value = "/profile-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadRecruiterPhotoResponse uploadProfilePhoto(
            Authentication auth, @RequestPart("file") MultipartFile file) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        String url = fileStorageService.storeRecruiterPhoto(recruiterUserId, file);
        recruiterProfileService.updatePhotoUrl(recruiterUserId, url);
        return new UploadRecruiterPhotoResponse(url);
    }

    @PostMapping(value = "/posts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public PostResponse createPost(
            Authentication auth,
            @RequestPart("caption") String caption,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        String imageUrl = "";
        if (file != null && !file.isEmpty()) {
            imageUrl = fileStorageService.storePostImage(recruiterUserId, file);
        }
        return postService.createPost(recruiterUserId, caption, imageUrl);
    }

    @PostMapping(value = "/job-attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadJobAttachmentResponse uploadJobAttachment(
            Authentication auth, @RequestPart("file") MultipartFile file) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        String url = fileStorageService.storeJobAttachment(recruiterUserId, file);
        String original = (file.getOriginalFilename() == null) ? "" : file.getOriginalFilename();
        return new UploadJobAttachmentResponse(url, original);
    }

    @GetMapping("/jobs")
    public List<RecruiterJobResponse> myJobs(Authentication auth) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        return recruiterService.myJobs(recruiterUserId);
    }

    @PostMapping("/jobs")
    @ResponseStatus(HttpStatus.CREATED)
    public RecruiterJobResponse createJob(Authentication auth, @Valid @RequestBody JobUpsertRequest req) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        return recruiterService.createJob(recruiterUserId, req);
    }

    @PutMapping("/jobs/{jobId}")
    public RecruiterJobResponse updateJob(
            Authentication auth, @PathVariable Long jobId, @Valid @RequestBody JobUpsertRequest req) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        return recruiterService.updateJob(recruiterUserId, jobId, req);
    }

    @DeleteMapping("/jobs/{jobId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteJob(Authentication auth, @PathVariable Long jobId) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        recruiterService.deleteJob(recruiterUserId, jobId);
    }

    @GetMapping("/jobs/{jobId}/matched-candidates")
    public List<MatchedCandidateResponse> matchedCandidates(Authentication auth, @PathVariable Long jobId) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        return recruiterService.matchedCandidates(recruiterUserId, jobId);
    }

    // Full candidate profile view for recruiters (LinkedIn-style full page on frontend).
    @GetMapping("/candidates/{candidateUserId}/profile")
    public CandidateProfileResponse candidateProfile(Authentication auth, @PathVariable Long candidateUserId) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        // Ensure recruiter is approved (controller already has PreAuthorize, but keep defense-in-depth).
        recruiterService.ensureRecruiterApproved(recruiterUserId);

        var profile = candidateService.getProfile(candidateUserId);

        String company = "";
        try {
            var rp = recruiterProfileService.getProfile(recruiterUserId);
            company = (rp == null || rp.getCompanyName() == null) ? "" : rp.getCompanyName();
        } catch (Exception ignored) {
            company = "";
        }
        notificationService.notifyUser(
                candidateUserId,
                recruiterUserId,
                NotificationType.PROFILE_VIEWED,
                "Profile Viewed",
                (company.isBlank() ? "A recruiter" : company) + " viewed your profile",
                "/candidate-dashboard?page=profile");
        return profile;
    }

    @GetMapping("/jobs/{jobId}/applications")
    public List<RecruiterApplicationResponse> applications(Authentication auth, @PathVariable Long jobId) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        return recruiterService.applicationsForJob(recruiterUserId, jobId);
    }

    @PutMapping("/applications/{applicationId}/status")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateStatus(
            Authentication auth,
            @PathVariable Long applicationId,
            @Valid @RequestBody UpdateApplicationStatusRequest req) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        recruiterService.updateApplicationStatus(recruiterUserId, applicationId, req.getStatus());
    }

    @PostMapping("/applications/{applicationId}/email")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void email(
            Authentication auth,
            @PathVariable Long applicationId,
            @Valid @RequestBody SendEmailRequest req) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        recruiterService.emailCandidate(recruiterUserId, applicationId, req.getSubject(), req.getMessage());
    }

    @GetMapping("/notifications")
    public List<RecruiterNotificationResponse> notifications(Authentication auth) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        return recruiterService.notifications(recruiterUserId);
    }
}
