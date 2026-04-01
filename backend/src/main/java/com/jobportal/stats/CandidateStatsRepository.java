package com.jobportal.stats;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidateStatsRepository extends JpaRepository<CandidateStats, Long> {
    Optional<CandidateStats> findByUserId(Long userId);
}

