package com.jobportal.stats;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecruiterStatsRepository extends JpaRepository<RecruiterStats, Long> {
    Optional<RecruiterStats> findByUserId(Long userId);
}

