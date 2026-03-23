package com.jobportal.auth;

import java.util.ArrayList;
import java.util.List;

public final class PasswordPolicy {
    private PasswordPolicy() {}

    public static List<String> validate(String password) {
        List<String> errors = new ArrayList<>();
        if (password == null) password = "";

        if (password.length() < 8) errors.add("Password must be at least 8 characters");
        if (password.length() > 72) errors.add("Password must be at most 72 characters");

        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = password.chars().anyMatch(c -> !Character.isLetterOrDigit(c));

        if (!hasUpper) errors.add("Password must contain an uppercase letter");
        if (!hasLower) errors.add("Password must contain a lowercase letter");
        if (!hasDigit) errors.add("Password must contain a number");
        if (!hasSpecial) errors.add("Password must contain a special character");

        return errors;
    }
}

