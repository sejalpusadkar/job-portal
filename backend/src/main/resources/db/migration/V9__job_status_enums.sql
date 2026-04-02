-- Align MySQL column types with Hibernate's expected ENUMs.

ALTER TABLE job_applications
    MODIFY COLUMN status ENUM('applied','shortlisted','technical','final_interview','offer','rejected') NOT NULL DEFAULT 'applied';

ALTER TABLE job_postings
    MODIFY COLUMN status ENUM('active','closed') NOT NULL DEFAULT 'active';

