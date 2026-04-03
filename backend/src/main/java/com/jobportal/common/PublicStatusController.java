package com.jobportal.common;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public endpoints for platform checks.
 *
 * Railway users often open the root domain in a browser. Without a public route,
 * Spring Security returns 401 and the default Whitelabel page looks like a failure.
 */
@RestController
public class PublicStatusController {

    @GetMapping("/")
    public Map<String, Object> root() {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("status", "ok");
        res.put("service", "job-portal-backend");
        res.put("time", Instant.now().toString());
        res.put("ping", "/api/auth/ping");
        return res;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("status", "ok");
        return res;
    }
}

