package com.jobportal.recruiter;

import com.jobportal.recruiter.dto.RecruiterProfileRequest;
import com.jobportal.recruiter.dto.RecruiterProfileResponse;
import com.jobportal.user.Role;
import com.jobportal.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class RecruiterProfileService {
    private final RecruiterProfileRepository recruiterProfileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public RecruiterProfileResponse getProfile(Long recruiterUserId) {
        var user =
                userRepository
                        .findById(recruiterUserId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getRole() != Role.RECRUITER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a recruiter user");
        }

        var profile =
                recruiterProfileRepository
                        .findByUserId(recruiterUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Recruiter profile not found"));

        return RecruiterProfileResponse.builder()
                .id(profile.getId())
                .userId(recruiterUserId)
                .email(user.getEmail())
                .companyName(profile.getCompanyName())
                .contactPerson(profile.getContactPerson())
                .phone(profile.getPhone())
                .position(profile.getPosition())
                .professionalSummary(profile.getProfessionalSummary())
                .profilePhotoUrl(profile.getProfilePhotoUrl())
                .build();
    }

    @Transactional
    public RecruiterProfileResponse upsert(Long recruiterUserId, RecruiterProfileRequest req) {
        var user =
                userRepository
                        .findById(recruiterUserId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (user.getRole() != Role.RECRUITER) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a recruiter user");
        }

        var profile =
                recruiterProfileRepository
                        .findByUserId(recruiterUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Recruiter profile not found"));

        profile.setCompanyName(req.getCompanyName().trim());
        profile.setContactPerson(req.getContactPerson().trim());
        profile.setPhone(req.getPhone().trim());
        profile.setPosition(req.getPosition() == null ? "" : req.getPosition().trim());
        profile.setProfessionalSummary(
                req.getProfessionalSummary() == null ? "" : req.getProfessionalSummary().trim());
        profile.setProfilePhotoUrl(req.getProfilePhotoUrl() == null ? "" : req.getProfilePhotoUrl().trim());
        recruiterProfileRepository.save(profile);
        return getProfile(recruiterUserId);
    }

    @Transactional
    public String updatePhotoUrl(Long recruiterUserId, String url) {
        var profile =
                recruiterProfileRepository
                        .findByUserId(recruiterUserId)
                        .orElseThrow(
                                () ->
                                        new ResponseStatusException(
                                                HttpStatus.NOT_FOUND, "Recruiter profile not found"));
        profile.setProfilePhotoUrl(url == null ? "" : url.trim());
        recruiterProfileRepository.save(profile);
        return profile.getProfilePhotoUrl();
    }
}

