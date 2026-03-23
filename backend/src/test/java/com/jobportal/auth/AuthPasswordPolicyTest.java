package com.jobportal.auth;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class AuthPasswordPolicyTest {
    @Test
    void weakPasswordProducesErrors() {
        var errs = PasswordPolicy.validate("abc");
        assertFalse(errs.isEmpty());
    }

    @Test
    void strongPasswordHasNoErrors() {
        var errs = PasswordPolicy.validate("Strong@123");
        assertTrue(errs.isEmpty());
    }
}

