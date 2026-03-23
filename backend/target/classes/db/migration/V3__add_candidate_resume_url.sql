-- Add resume_url to candidate_profiles for storing uploaded CV/resume file URL.
-- Keep NOT NULL with default empty string to match entity defaults.

ALTER TABLE candidate_profiles
    ADD COLUMN resume_url VARCHAR(512) NOT NULL DEFAULT '';

