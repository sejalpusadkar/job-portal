package com.jobportal.notification;

import com.jobportal.notification.dto.NotificationResponse;
import com.jobportal.user.UserRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public void notifyUser(
            Long recipientUserId,
            Long actorUserId,
            NotificationType type,
            String title,
            String description,
            String actionUrl) {
        if (recipientUserId == null) return;
        var recipient =
                userRepository
                        .findById(recipientUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Recipient user not found"));

        // De-dupe noisy events like repeated profile views.
        if (actorUserId != null) {
            Instant cutoff = Instant.now().minus(2, ChronoUnit.HOURS);
            boolean exists =
                    notificationRepository
                            .existsByRecipientUserIdAndActorUserIdAndTypeAndActionUrlAndCreatedAtAfter(
                                    recipientUserId, actorUserId, type.name(), actionUrl, cutoff);
            if (exists) return;
        }

        var n = new Notification();
        n.setRecipientUser(recipient);
        n.setActorUserId(actorUserId);
        n.setType(type.name());
        n.setTitle(title == null ? "" : title);
        n.setDescription(description == null ? "" : description);
        n.setActionUrl(actionUrl == null ? "" : actionUrl);
        n.setCreatedAt(Instant.now());
        notificationRepository.save(n);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(Long userId, boolean unreadOnly) {
        var list =
                unreadOnly
                        ? notificationRepository.findTop100ByRecipientUserIdAndReadAtIsNullOrderByCreatedAtDesc(
                                userId)
                        : notificationRepository.findTop100ByRecipientUserIdOrderByCreatedAtDesc(userId);
        return list.stream()
                .map(
                        n ->
                                NotificationResponse.builder()
                                        .id(n.getId())
                                        .type(n.getType())
                                        .title(n.getTitle())
                                        .description(n.getDescription())
                                        .actionUrl(n.getActionUrl())
                                        .unread(n.getReadAt() == null)
                                        .createdAt(n.getCreatedAt())
                                        .build())
                .toList();
    }

    @Transactional
    public void markRead(Long userId, Long notificationId) {
        var n =
                notificationRepository
                        .findById(notificationId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Notification not found"));
        if (!n.getRecipientUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
        }
        if (n.getReadAt() == null) {
            n.setReadAt(Instant.now());
            notificationRepository.save(n);
        }
    }

    @Transactional
    public void markAllRead(Long userId) {
        var unread = notificationRepository.findTop100ByRecipientUserIdAndReadAtIsNullOrderByCreatedAtDesc(userId);
        if (unread.isEmpty()) return;
        Instant now = Instant.now();
        unread.forEach(n -> n.setReadAt(now));
        notificationRepository.saveAll(unread);
    }
}

