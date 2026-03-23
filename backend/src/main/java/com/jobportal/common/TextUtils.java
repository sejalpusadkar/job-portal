package com.jobportal.common;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

public final class TextUtils {
    private TextUtils() {}

    public static String normalizeToken(String s) {
        if (s == null) return "";
        String t = s.trim().toLowerCase(Locale.ROOT);
        // Collapse inner whitespace to a single space for nicer matching.
        t = t.replaceAll("\\s+", " ");
        return t;
    }

    public static Set<String> normalizeTokens(Iterable<String> tokens) {
        Set<String> out = new LinkedHashSet<>();
        if (tokens == null) return out;
        for (String t : tokens) {
            String n = normalizeToken(t);
            if (!n.isBlank()) out.add(n);
        }
        return out;
    }

    public static Set<String> splitAndNormalize(String csvLike) {
        if (csvLike == null || csvLike.isBlank()) return new LinkedHashSet<>();
        // Accept comma or newline separated.
        return normalizeTokens(Arrays.asList(csvLike.split("[,\\n]")));
    }
}

