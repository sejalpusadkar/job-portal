package com.jobportal.matching;

import com.jobportal.candidate.CandidateProfile;
import com.jobportal.common.TextUtils;
import com.jobportal.job.JobPosting;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class MatchingService {
    // Weighting rules (easy to tune later)
    private static final int SKILL_WEIGHT = 10;
    private static final int KEYWORD_WEIGHT = 3;
    private static final int EXPERIENCE_BONUS = 2;

    public MatchScore score(CandidateProfile candidate, JobPosting job) {
        Set<String> cSkills = TextUtils.normalizeTokens(candidate.getSkills());
        Set<String> cKeywords = TextUtils.normalizeTokens(candidate.getKeywords());

        Set<String> jSkills = TextUtils.normalizeTokens(job.getRequiredSkills());
        Set<String> jKeywords = TextUtils.normalizeTokens(job.getKeywords());

        int skillMatches = intersectionSize(cSkills, jSkills);
        int keywordMatches = intersectionSize(cKeywords, jKeywords);

        int score = (skillMatches * SKILL_WEIGHT) + (keywordMatches * KEYWORD_WEIGHT);
        if (candidate.getExperienceYears() >= job.getMinExperienceYears()) {
            score += EXPERIENCE_BONUS;
        }

        int maxScore =
                (Math.max(1, jSkills.size()) * SKILL_WEIGHT)
                        + (Math.max(0, jKeywords.size()) * KEYWORD_WEIGHT)
                        + EXPERIENCE_BONUS;

        int percent = (int) Math.round((score * 100.0) / maxScore);
        if (percent < 0) percent = 0;
        if (percent > 100) percent = 100;

        return new MatchScore(score, percent, skillMatches, keywordMatches);
    }

    private static int intersectionSize(Set<String> a, Set<String> b) {
        if (a.isEmpty() || b.isEmpty()) return 0;
        int count = 0;
        for (String x : a) {
            if (b.contains(x)) count++;
        }
        return count;
    }
}

