package com.jobportal.post;

import com.jobportal.common.FileStorageService;
import com.jobportal.post.dto.CandidatePostRequest;
import com.jobportal.post.dto.CandidatePostResponse;
import com.jobportal.post.dto.UploadPostImageResponse;
import com.jobportal.security.UserPrincipal;
import com.jobportal.user.Role;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequiredArgsConstructor
public class CandidatePostController {
    private final CandidatePostService candidatePostService;
    private final FileStorageService fileStorageService;

    @PostMapping("/api/candidate/posts")
    public CandidatePostResponse create(Authentication auth, @Valid @RequestBody CandidatePostRequest req) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return candidatePostService.create(userId, req);
    }

    @GetMapping("/api/candidate/posts/me")
    public List<CandidatePostResponse> myPosts(Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return candidatePostService.listByCandidate(userId);
    }

    // Read posts for a candidate (recruiter/admin can view any; candidate can view own).
    @GetMapping("/api/candidates/{candidateUserId}/posts")
    public List<CandidatePostResponse> postsForCandidate(
            Authentication auth, @PathVariable Long candidateUserId) {
        var principal = (UserPrincipal) auth.getPrincipal();
        if (principal.getRole() == Role.CANDIDATE && !principal.getId().equals(candidateUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        return candidatePostService.listByCandidate(candidateUserId);
    }

    @PostMapping(value = "/api/candidate/posts/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UploadPostImageResponse uploadPostImage(
            Authentication auth, @RequestPart("file") MultipartFile file) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        String url = fileStorageService.storeCandidatePostImage(userId, file);
        return new UploadPostImageResponse(url);
    }
}

