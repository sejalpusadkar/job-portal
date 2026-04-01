package com.jobportal.stats;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DailyStatsScheduler {
    private final StatsService statsService;

    // Runs once daily at 02:10 AM server local time.
    @Scheduled(cron = "0 10 2 * * *")
    public void refreshDaily() {
        statsService.refreshAll();
    }
}

