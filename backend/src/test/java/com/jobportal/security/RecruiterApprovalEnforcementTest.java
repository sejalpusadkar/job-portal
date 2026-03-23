package com.jobportal.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@TestPropertySource(
        properties = {
            "admin.registration.code=TEST_ADMIN_CODE"
        })
public class RecruiterApprovalEnforcementTest {
    @Autowired private MockMvc mvc;
    @Autowired private ObjectMapper om;

    private String registerAndLogin(String email, String password, String role, Map<String, Object> extra)
            throws Exception {
        var reg = new java.util.HashMap<String, Object>();
        reg.put("email", email);
        reg.put("password", password);
        reg.put("role", role);
        reg.put("fullName", "Test User");
        reg.put("phone", "9999999999");
        if (extra != null) reg.putAll(extra);

        mvc.perform(
                        post("/api/auth/register")
                                .contentType("application/json")
                                .content(om.writeValueAsString(reg)))
                .andExpect(status().isCreated());

        var loginRes =
                mvc.perform(
                                post("/api/auth/login")
                                        .contentType("application/json")
                                        .content(
                                                om.writeValueAsString(
                                                        Map.of("email", email, "password", password))))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();

        return om.readTree(loginRes).get("token").asText();
    }

    @Test
    void recruiterApisForbiddenUntilApproved() throws Exception {
        String recruiterEmail = "recruiter1@example.com";
        String pw = "Strong@123";

        String recruiterToken =
                registerAndLogin(
                        recruiterEmail,
                        pw,
                        "RECRUITER",
                        Map.of("companyName", "Acme", "contactPerson", "Person", "phone", "9999999999"));

        // Not approved: blocked
        mvc.perform(get("/api/recruiter/jobs").header("Authorization", "Bearer " + recruiterToken))
                .andExpect(status().isForbidden());

        // Create admin and approve recruiter
        String adminToken =
                registerAndLogin(
                        "admin1@example.com",
                        "Strong@123",
                        "ADMIN",
                        Map.of("adminRegistrationCode", "TEST_ADMIN_CODE"));

        // List pending recruiters and approve the first matching email
        var pendingJson =
                mvc.perform(get("/api/admin/recruiters/pending").header("Authorization", "Bearer " + adminToken))
                        .andExpect(status().isOk())
                        .andReturn()
                        .getResponse()
                        .getContentAsString();

        var arr = om.readTree(pendingJson);
        Long userId = null;
        for (var node : arr) {
            if (recruiterEmail.equalsIgnoreCase(node.get("email").asText())) {
                userId = node.get("userId").asLong();
                break;
            }
        }
        assertNotNull(userId);

        mvc.perform(
                        post("/api/admin/recruiters/" + userId + "/approve")
                                .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Approved: recruiter endpoints are accessible (may return empty list, but should be 200).
        mvc.perform(get("/api/recruiter/jobs").header("Authorization", "Bearer " + recruiterToken))
                .andExpect(status().isOk());
    }
}
