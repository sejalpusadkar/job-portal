-- Drop legacy duplicate tables if present.
-- These tables are not used by the current application (canonical tables are job_postings/job_applications/etc).
-- Note: These statements will be NOOP in fresh production databases because these tables won't exist.

DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS candidates;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS recruiters;

