package com.jobportal.post.dto;

import com.jobportal.post.CandidatePostType;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class CandidatePostResponse {
    private Long id;
    private Long candidateUserId;
    private String candidateName;
    private String candidatePhotoDataUrl;
    private CandidatePostType type;
    private String content;
    private String imageUrl;
    private String linkUrl;
    private Instant createdAt;
}

