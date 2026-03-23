package com.jobportal.post.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class PostResponse {
    private Long id;
    private Long recruiterUserId;
    private String recruiterEmail;
    private String companyName;
    private String recruiterPhotoUrl;
    private String caption;
    private String imageUrl;
    private int likeCount;
    private int commentCount;
    private int shareCount;
    private boolean likedByMe;
    private Instant createdAt;
}

