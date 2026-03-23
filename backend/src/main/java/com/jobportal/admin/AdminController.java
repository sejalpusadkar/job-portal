package com.jobportal.admin;

import com.jobportal.admin.dto.AdminMetricsResponse;
import com.jobportal.admin.dto.AdminApplicationResponse;
import com.jobportal.admin.dto.AdminJobResponse;
import com.jobportal.admin.dto.AdminUserResponse;
import com.jobportal.admin.dto.PendingRecruiterResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/recruiters/pending")
    public List<PendingRecruiterResponse> pendingRecruiters() {
        return adminService.pendingRecruiters();
    }

    @PostMapping("/recruiters/{userId}/approve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(@PathVariable Long userId) {
        adminService.approveRecruiter(userId);
    }

    @PostMapping("/recruiters/{userId}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@PathVariable Long userId) {
        adminService.rejectRecruiter(userId);
    }

    @GetMapping("/users")
    public List<AdminUserResponse> users() {
        return adminService.users();
    }

    @DeleteMapping("/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
    }

    @GetMapping("/metrics")
    public AdminMetricsResponse metrics() {
        return adminService.metrics();
    }

    @GetMapping("/jobs")
    public List<AdminJobResponse> jobs(@RequestParam(name = "limit", defaultValue = "50") int limit) {
        return adminService.jobs(limit);
    }

    @GetMapping("/applications")
    public List<AdminApplicationResponse> applications(
            @RequestParam(name = "limit", defaultValue = "50") int limit) {
        return adminService.applications(limit);
    }
}
