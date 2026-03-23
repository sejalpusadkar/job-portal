package com.jobportal.matching;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MatchScore {
    private int rawScore;
    private int percentScore;
    private int exactSkillMatches;
    private int keywordMatches;
}

