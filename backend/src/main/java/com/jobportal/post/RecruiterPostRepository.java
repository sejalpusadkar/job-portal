package com.jobportal.post;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecruiterPostRepository extends JpaRepository<RecruiterPost, Long> {
    List<RecruiterPost> findTop50ByOrderByCreatedAtDesc();

    List<RecruiterPost> findTop50ByRecruiterUserIdOrderByCreatedAtDesc(Long recruiterUserId);
}
