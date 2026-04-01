package com.jobportal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class JobPortalApplication {
    public static void main(String[] args) {
        var ctx = SpringApplication.run(JobPortalApplication.class, args);

        String port = ctx.getEnvironment().getProperty("local.server.port");
        if (port == null || port.isBlank()) {
            port = ctx.getEnvironment().getProperty("server.port", "8080");
        }

        // Keep startup logs simple and avoid hardcoding ports.
        System.out.println("Job Portal Backend Started Successfully");
        System.out.println("Server listening on port: " + port);
    }
}
