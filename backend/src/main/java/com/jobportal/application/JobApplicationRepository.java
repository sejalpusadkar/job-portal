package com.jobportal.application;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    boolean existsByCandidateUserIdAndJobId(Long candidateUserId, Long jobId);

    Optional<JobApplication> findByCandidateUserIdAndJobId(Long candidateUserId, Long jobId);

    List<JobApplication> findByCandidateUserIdOrderByAppliedAtDesc(Long candidateUserId);

    List<JobApplication> findByJobIdOrderByAppliedAtDesc(Long jobId);

    Optional<JobApplication> findByIdAndJobRecruiterUserId(Long id, Long recruiterUserId);
}
