package com.jobportal.job;

import com.jobportal.job.dto.JobResponse;
import com.jobportal.recruiter.RecruiterProfileRepository;
import com.jobportal.user.User;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {
    private final JobPostingRepository jobPostingRepository;
    private final RecruiterProfileRepository recruiterProfileRepository;

    @GetMapping
    public List<JobResponse> list() {
        var jobs = jobPostingRepository.findActiveWithRecruiterUser(JobStatus.ACTIVE);
        var recruiterIds = jobs.stream().map(j -> j.getRecruiterUser().getId()).distinct().toList();
        Map<Long, String> companyByUserId =
                recruiterProfileRepository.findByUserIdIn(recruiterIds).stream()
                        .collect(
                                java.util.stream.Collectors.toMap(
                                        rp -> rp.getUserId(), rp -> rp.getCompanyName()));

        return jobs.stream()
                .map(j -> toDto(j, companyByUserId.get(j.getRecruiterUser().getId())))
                .toList();
    }

    @GetMapping("/{id}")
    public JobResponse get(@PathVariable Long id) {
        var job =
                jobPostingRepository
                        .findByIdWithRecruiterUser(id)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job not found"));
        String company =
                recruiterProfileRepository
                        .findByUserId(job.getRecruiterUser().getId())
                        .map(rp -> rp.getCompanyName())
                        .orElse("");
        return toDto(job, company);
    }

    private static JobResponse toDto(JobPosting job, String companyName) {
        User recruiter = job.getRecruiterUser();
        return JobResponse.builder()
                .id(job.getId())
                .recruiterUserId(recruiter == null ? null : recruiter.getId())
                .companyName(companyName == null ? "" : companyName)
                .recruiterEmail(recruiter == null ? "" : recruiter.getEmail())
                .title(job.getTitle())
                .description(job.getDescription())
                .minExperienceYears(job.getMinExperienceYears())
                .minCtc(job.getMinCtc())
                .maxCtc(job.getMaxCtc())
                .ctcCurrency(job.getCtcCurrency())
                .ctcFrequency(job.getCtcFrequency())
                .salaryHidden(job.isSalaryHidden())
                .requiredSkills(job.getRequiredSkills())
                .keywords(job.getKeywords())
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .build();
    }
}
