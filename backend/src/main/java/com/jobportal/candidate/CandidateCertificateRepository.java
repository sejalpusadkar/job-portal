package com.jobportal.candidate;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidateCertificateRepository extends JpaRepository<CandidateCertificate, Long> {
    List<CandidateCertificate> findByCandidateUserIdOrderByUploadedAtDesc(Long candidateUserId);

    Optional<CandidateCertificate> findByIdAndCandidateUserId(Long id, Long candidateUserId);
}

