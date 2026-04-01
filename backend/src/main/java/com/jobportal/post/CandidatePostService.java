package com.jobportal.post;

import com.jobportal.candidate.CandidateProfileRepository;
import com.jobportal.post.dto.CandidatePostRequest;
import com.jobportal.post.dto.CandidatePostResponse;
import com.jobportal.user.Role;
import com.jobportal.user.UserRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class CandidatePostService {
    private final CandidatePostRepository candidatePostRepository;
    private final UserRepository userRepository;
    private final CandidateProfileRepository candidateProfileRepository;

    @Transactional
    public CandidatePostResponse create(Long candidateUserId, CandidatePostRequest req) {
        var user =
                userRepository
                        .findById(candidateUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "User not found"));
        if (user.getRole() != Role.CANDIDATE) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only candidates can post");
        }

        var post = new CandidatePost();
        post.setCandidateUser(user);
        post.setType(req.getType());
        post.setContent(req.getContent());
        post.setImageUrl(req.getImageUrl() == null ? "" : req.getImageUrl());
        post.setLinkUrl(req.getLinkUrl() == null ? "" : req.getLinkUrl());
        post.setCreatedAt(Instant.now());
        candidatePostRepository.save(post);
        return toDto(post);
    }

    @Transactional(readOnly = true)
    public List<CandidatePostResponse> listByCandidate(Long candidateUserId) {
        return candidatePostRepository.findTop50ByCandidateUserIdOrderByCreatedAtDesc(candidateUserId).stream()
                .map(this::toDto)
                .toList();
    }

    private CandidatePostResponse toDto(CandidatePost post) {
        var profile =
                candidateProfileRepository.findByUserId(post.getCandidateUser().getId()).orElse(null);
        String name = profile == null ? "" : profile.getFullName();
        String photo = profile == null ? "" : profile.getProfilePhotoDataUrl();
        return CandidatePostResponse.builder()
                .id(post.getId())
                .candidateUserId(post.getCandidateUser().getId())
                .candidateName(name)
                .candidatePhotoDataUrl(photo)
                .type(post.getType())
                .content(post.getContent())
                .imageUrl(post.getImageUrl())
                .linkUrl(post.getLinkUrl())
                .createdAt(post.getCreatedAt())
                .build();
    }
}

