package com.jobportal.post.dto;

import com.jobportal.post.CandidatePostType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CandidatePostRequest {
    @NotNull private CandidatePostType type;

    @NotBlank
    @Size(max = 4000)
    private String content;

    @Size(max = 512)
    private String imageUrl;

    @Size(max = 512)
    private String linkUrl;
}

