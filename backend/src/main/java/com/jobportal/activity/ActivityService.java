package com.jobportal.activity;

import com.jobportal.activity.dto.ActivityResponse;
import com.jobportal.user.UserRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class ActivityService {
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    @Transactional
    public void log(Long recruiterUserId, ActivityType type, String message, Long jobId, Long candidateUserId) {
        if (recruiterUserId == null) return;
        var recruiter =
                userRepository
                        .findById(recruiterUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Recruiter not found"));
        var a = new Activity();
        a.setRecruiterUser(recruiter);
        a.setType(type.name());
        a.setMessage(message == null ? "" : message.trim());
        a.setJobId(jobId);
        a.setCandidateUserId(candidateUserId);
        a.setCreatedAt(Instant.now());
        activityRepository.save(a);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> listForRecruiter(Long recruiterUserId) {
        return activityRepository.findTop50ByRecruiterUserIdOrderByCreatedAtDesc(recruiterUserId).stream()
                .map(
                        a ->
                                ActivityResponse.builder()
                                        .id(a.getId())
                                        .type(a.getType())
                                        .message(a.getMessage())
                                        .createdAt(a.getCreatedAt())
                                        .jobId(a.getJobId())
                                        .candidateUserId(a.getCandidateUserId())
                                        .build())
                .toList();
    }
}

