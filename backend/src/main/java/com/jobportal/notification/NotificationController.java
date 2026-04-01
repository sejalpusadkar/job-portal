package com.jobportal.notification;

import com.jobportal.notification.dto.NotificationResponse;
import com.jobportal.security.UserPrincipal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationResponse> list(
            Authentication auth, @RequestParam(name = "unreadOnly", defaultValue = "false") boolean unreadOnly) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return notificationService.list(userId, unreadOnly);
    }

    @PostMapping("/{id}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(Authentication auth, @PathVariable Long id) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        notificationService.markRead(userId, id);
    }

    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        notificationService.markAllRead(userId);
    }
}

