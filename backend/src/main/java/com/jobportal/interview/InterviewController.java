package com.jobportal.interview;

import com.jobportal.interview.dto.InterviewResponse;
import com.jobportal.interview.dto.ScheduleInterviewRequest;
import com.jobportal.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InterviewController {
    private final InterviewService interviewService;

    @PostMapping("/recruiter/interviews")
    @ResponseStatus(HttpStatus.CREATED)
    public InterviewResponse schedule(Authentication auth, @Valid @RequestBody ScheduleInterviewRequest req) {
        Long recruiterUserId = ((UserPrincipal) auth.getPrincipal()).getId();
        return interviewService.schedule(recruiterUserId, req);
    }

    @GetMapping("/candidate/interviews")
    public List<InterviewResponse> myCandidateInterviews(Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return interviewService.listForCandidate(userId);
    }

    @GetMapping("/recruiter/interviews")
    public List<InterviewResponse> myRecruiterInterviews(Authentication auth) {
        Long userId = ((UserPrincipal) auth.getPrincipal()).getId();
        return interviewService.listForRecruiter(userId);
    }
}

