package com.jobportal.interview;

import com.jobportal.interview.dto.InterviewResponse;
import com.jobportal.interview.dto.ScheduleInterviewRequest;
import com.jobportal.candidate.CandidateProfileRepository;
import com.jobportal.job.JobPostingRepository;
import com.jobportal.activity.ActivityService;
import com.jobportal.activity.ActivityType;
import com.jobportal.notification.NotificationService;
import com.jobportal.notification.NotificationType;
import com.jobportal.recruiter.RecruiterProfileRepository;
import com.jobportal.recruiter.RecruiterService;
import com.jobportal.user.Role;
import com.jobportal.user.UserRepository;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class InterviewService {
    private final InterviewRepository interviewRepository;
    private final JobPostingRepository jobPostingRepository;
    private final UserRepository userRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final RecruiterProfileRepository recruiterProfileRepository;
    private final RecruiterService recruiterService;
    private final NotificationService notificationService;
    private final ActivityService activityService;

    private static final DateTimeFormatter HUMAN_TIME =
            DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm").withZone(ZoneId.systemDefault());

    @Transactional
    public InterviewResponse schedule(Long recruiterUserId, ScheduleInterviewRequest req) {
        recruiterService.ensureRecruiterApproved(recruiterUserId);

        var job =
                jobPostingRepository
                        .findByIdAndRecruiterUserId(req.getJobId(), recruiterUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Job not found"));

        var candidate =
                userRepository
                        .findById(req.getCandidateUserId())
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Candidate not found"));
        if (candidate.getRole() != Role.CANDIDATE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a candidate");
        }

        var recruiter =
                userRepository
                        .findById(recruiterUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Recruiter not found"));

        var interview = new Interview();
        interview.setJob(job);
        interview.setCandidateUser(candidate);
        interview.setRecruiterUser(recruiter);
        interview.setType(req.getType());
        interview.setMode(req.getMode());
        interview.setStatus(InterviewStatus.SCHEDULED);
        interview.setScheduledAt(req.getScheduledAt());
        interview.setMeetingLink(req.getMeetingLink() == null ? "" : req.getMeetingLink());
        interview.setNotes(req.getNotes() == null ? "" : req.getNotes());
        interview.setCreatedAt(Instant.now());
        interviewRepository.save(interview);

        String company =
                recruiterProfileRepository
                        .findByUserId(recruiterUserId)
                        .map(rp -> rp.getCompanyName())
                        .orElse("");

        String when = HUMAN_TIME.format(interview.getScheduledAt());
        notificationService.notifyUser(
                candidate.getId(),
                recruiterUserId,
                NotificationType.INTERVIEW_SCHEDULED,
                "Interview Scheduled",
                "Interview for " + job.getTitle() + " at " + (company.isBlank() ? "the company" : company) + " on " + when,
                "/candidate-dashboard?page=interviews");

        activityService.log(
                recruiterUserId,
                ActivityType.INTERVIEW_SCHEDULED,
                "Interview scheduled for " + job.getTitle() + " on " + when,
                job.getId(),
                candidate.getId());

        return toDto(interview, company);
    }

    @Transactional(readOnly = true)
    public List<InterviewResponse> listForCandidate(Long candidateUserId) {
        return interviewRepository.findByCandidateUserIdOrderByScheduledAtAsc(candidateUserId).stream()
                .map(i -> toDto(i, companyForRecruiter(i.getRecruiterUser().getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<InterviewResponse> listForRecruiter(Long recruiterUserId) {
        recruiterService.ensureRecruiterApproved(recruiterUserId);
        String company = companyForRecruiter(recruiterUserId);
        return interviewRepository.findByRecruiterUserIdOrderByScheduledAtAsc(recruiterUserId).stream()
                .map(i -> toDto(i, company))
                .toList();
    }

    private String companyForRecruiter(Long recruiterUserId) {
        return recruiterProfileRepository.findByUserId(recruiterUserId).map(rp -> rp.getCompanyName()).orElse("");
    }

    private InterviewResponse toDto(Interview i, String company) {
        var candProfile = candidateProfileRepository.findByUserId(i.getCandidateUser().getId()).orElse(null);
        String candidateName = candProfile == null ? "" : candProfile.getFullName();
        String candidateRole = candProfile == null ? "" : candProfile.getRoleTitle();
        String candidatePhoto = candProfile == null ? "" : candProfile.getProfilePhotoDataUrl();
        return InterviewResponse.builder()
                .id(i.getId())
                .jobId(i.getJob().getId())
                .jobTitle(i.getJob().getTitle())
                .companyName(company == null ? "" : company)
                .candidateUserId(i.getCandidateUser().getId())
                .candidateName(candidateName)
                .candidateRoleTitle(candidateRole)
                .candidatePhotoDataUrl(candidatePhoto)
                .recruiterUserId(i.getRecruiterUser().getId())
                .type(i.getType())
                .mode(i.getMode())
                .status(i.getStatus())
                .scheduledAt(i.getScheduledAt())
                .meetingLink(i.getMeetingLink())
                .notes(i.getNotes())
                .build();
    }
}
