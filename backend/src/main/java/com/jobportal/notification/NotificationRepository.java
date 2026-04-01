package com.jobportal.notification;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findTop100ByRecipientUserIdOrderByCreatedAtDesc(Long recipientUserId);

    List<Notification> findTop100ByRecipientUserIdAndReadAtIsNullOrderByCreatedAtDesc(Long recipientUserId);

    void deleteByRecipientUserId(Long recipientUserId);

    long countByRecipientUserIdAndType(Long recipientUserId, String type);

    boolean existsByRecipientUserIdAndActorUserIdAndTypeAndActionUrlAndCreatedAtAfter(
            Long recipientUserId, Long actorUserId, String type, String actionUrl, Instant createdAfter);
}
