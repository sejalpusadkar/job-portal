package com.jobportal.interview;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByCandidateUserIdOrderByScheduledAtAsc(Long candidateUserId);

    List<Interview> findByRecruiterUserIdOrderByScheduledAtAsc(Long recruiterUserId);

    long countByCandidateUserIdAndStatus(Long candidateUserId, InterviewStatus status);

    long countByRecruiterUserIdAndStatus(Long recruiterUserId, InterviewStatus status);
}
