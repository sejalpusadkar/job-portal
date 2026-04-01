package com.jobportal.activity;

import com.jobportal.activity.dto.ActivityResponse;
import com.jobportal.security.UserPrincipal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/recruiter")
@RequiredArgsConstructor
@PreAuthorize("authentication.principal.recruiterApproved == true")
public class ActivityController {
    private final ActivityService activityService;

    @GetMapping("/activities")
    public List<ActivityResponse> myActivities(Authentication auth) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        return activityService.listForRecruiter(recruiterUserId);
    }
}
