package com.jobportal.post.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class CommentResponse {
    private Long id;
    private Long userId;
    private String userEmail;
    private String text;
    private Instant createdAt;
}

