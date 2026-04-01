package com.jobportal.post;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidatePostRepository extends JpaRepository<CandidatePost, Long> {
    List<CandidatePost> findTop50ByCandidateUserIdOrderByCreatedAtDesc(Long candidateUserId);
}

