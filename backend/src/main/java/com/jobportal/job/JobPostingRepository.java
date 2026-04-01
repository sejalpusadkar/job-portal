package com.jobportal.job;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    List<JobPosting> findByStatus(JobStatus status);

    List<JobPosting> findByRecruiterUserIdOrderByCreatedAtDesc(Long recruiterUserId);

    long countByRecruiterUserIdAndStatus(Long recruiterUserId, JobStatus status);

    Optional<JobPosting> findByIdAndRecruiterUserId(Long id, Long recruiterUserId);

    @Query("select jp from JobPosting jp join fetch jp.recruiterUser ru where jp.status = :status")
    List<JobPosting> findActiveWithRecruiterUser(@Param("status") JobStatus status);

    @Query("select jp from JobPosting jp join fetch jp.recruiterUser ru where jp.id = :id")
    Optional<JobPosting> findByIdWithRecruiterUser(@Param("id") Long id);
}
