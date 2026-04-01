package com.jobportal.stats;

import com.jobportal.security.UserPrincipal;
import com.jobportal.stats.dto.CandidateStatsResponse;
import com.jobportal.stats.dto.RecruiterStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class StatsController {
    private final StatsService statsService;

    @GetMapping("/candidate/stats")
    public CandidateStatsResponse candidateStats(Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return statsService.getCandidateStats(userId);
    }

    @GetMapping("/recruiter/stats")
    @PreAuthorize("authentication.principal.recruiterApproved == true")
    public RecruiterStatsResponse recruiterStats(Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return statsService.getRecruiterStats(userId);
    }
}

