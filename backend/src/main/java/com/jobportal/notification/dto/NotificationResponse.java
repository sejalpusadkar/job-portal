package com.jobportal.notification.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String type;
    private String title;
    private String description;
    private String actionUrl;
    private boolean unread;
    private Instant createdAt;
}

