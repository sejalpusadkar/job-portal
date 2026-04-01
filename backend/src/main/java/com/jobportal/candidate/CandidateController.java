package com.jobportal.candidate;

import com.jobportal.candidate.dto.ApplicationResponse;
import com.jobportal.candidate.dto.CandidateProfileRequest;
import com.jobportal.candidate.dto.CandidateProfileResponse;
import com.jobportal.candidate.dto.MatchedJobResponse;
import com.jobportal.candidate.dto.UploadPhotoResponse;
import com.jobportal.candidate.dto.UploadResumeResponse;
import com.jobportal.common.FileStorageService;
import com.jobportal.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
import org.springframework.http.MediaType;
import com.jobportal.candidate.dto.CandidateCertificateResponse;
import com.jobportal.candidate.dto.CandidateApplicationDetailResponse;

@RestController
@RequestMapping("/api/candidate")
@RequiredArgsConstructor
public class CandidateController {
    private final CandidateService candidateService;
    private final FileStorageService fileStorageService;

    @GetMapping("/profile")
    public CandidateProfileResponse profile(Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return candidateService.getProfile(userId);
    }

    @PutMapping("/profile")
    public CandidateProfileResponse upsertProfile(
            Authentication auth, @Valid @RequestBody CandidateProfileRequest req) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return candidateService.upsertProfile(userId, req);
    }

    @PostMapping(value = "/profile-photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadPhotoResponse uploadProfilePhoto(
            Authentication auth, @RequestPart("file") MultipartFile file) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        String url = fileStorageService.storeProfilePhoto(userId, file);
        return new UploadPhotoResponse(url);
    }

    @PostMapping(value = "/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadResumeResponse uploadResume(Authentication auth, @RequestPart("file") MultipartFile file) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        String url = fileStorageService.storeCandidateResume(userId, file);
        candidateService.uploadResume(userId, url);
        return new UploadResumeResponse(url);
    }

    @GetMapping("/matched-jobs")
    public List<MatchedJobResponse> matchedJobs(Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return candidateService.matchedJobs(userId);
    }

    @PostMapping("/apply/{jobId}")
    @ResponseStatus(HttpStatus.CREATED)
    public void apply(Authentication auth, @PathVariable Long jobId) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        candidateService.apply(userId, jobId);
    }

    @GetMapping("/applications")
    public List<ApplicationResponse> applications(Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return candidateService.applications(userId);
    }

    @GetMapping("/applications/{applicationId}")
    public CandidateApplicationDetailResponse applicationDetail(
            Authentication auth, @PathVariable Long applicationId) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return candidateService.applicationDetail(userId, applicationId);
    }

    @GetMapping("/certificates")
    public List<CandidateCertificateResponse> certificates(Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return candidateService.certificates(userId);
    }

    @PostMapping(value = "/certificates", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<CandidateCertificateResponse> uploadCertificates(
            Authentication auth, @RequestPart("files") List<MultipartFile> files) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return candidateService.uploadCertificates(userId, files);
    }

    @DeleteMapping("/certificates/{certificateId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCertificate(Authentication auth, @PathVariable Long certificateId) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        candidateService.deleteCertificate(userId, certificateId);
    }
}
