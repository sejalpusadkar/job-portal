package com.jobportal.candidate.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class CandidateCertificateResponse {
    private Long id;
    private String fileUrl;
    private String originalName;
    private String contentType;
    private long sizeBytes;
    private Instant uploadedAt;
}

