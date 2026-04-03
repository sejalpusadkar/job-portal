-- Fix ENUM casing to match Java enums using @Enumerated(EnumType.STRING).
-- Earlier migrations created lowercase MySQL ENUM values (e.g. 'active'), which breaks
-- JPA when reading into uppercase Java enums (e.g. JobStatus.ACTIVE).

-- Job postings status
UPDATE job_postings
SET status = UPPER(status)
WHERE status IN ('active', 'closed');

ALTER TABLE job_postings
    MODIFY COLUMN status ENUM('ACTIVE','CLOSED') NOT NULL DEFAULT 'ACTIVE';

-- Job applications status
UPDATE job_applications
SET status = UPPER(status)
WHERE status IN ('applied','shortlisted','technical','final_interview','offer','rejected');

ALTER TABLE job_applications
    MODIFY COLUMN status ENUM('APPLIED','SHORTLISTED','TECHNICAL','FINAL_INTERVIEW','OFFER','REJECTED')
        NOT NULL DEFAULT 'APPLIED';

-- Interviews enums
UPDATE interviews
SET type = UPPER(type)
WHERE type IN ('hr','technical');

UPDATE interviews
SET mode = UPPER(mode)
WHERE mode IN ('online','onsite');

UPDATE interviews
SET status = UPPER(status)
WHERE status IN ('scheduled','completed','cancelled');

ALTER TABLE interviews
    MODIFY COLUMN type ENUM('HR','TECHNICAL') NOT NULL DEFAULT 'HR',
    MODIFY COLUMN mode ENUM('ONLINE','ONSITE') NOT NULL DEFAULT 'ONLINE',
    MODIFY COLUMN status ENUM('SCHEDULED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED';

-- Candidate posts type
UPDATE candidate_posts
SET type = UPPER(type)
WHERE type IN ('achievement','certification','project','update');

ALTER TABLE candidate_posts
    MODIFY COLUMN type ENUM('ACHIEVEMENT','CERTIFICATION','PROJECT','UPDATE') NOT NULL DEFAULT 'UPDATE';

