-- Recruiter profile additional fields

ALTER TABLE recruiter_profiles
    ADD COLUMN position VARCHAR(128) NOT NULL DEFAULT '',
    ADD COLUMN professional_summary VARCHAR(2000) NOT NULL DEFAULT '',
    ADD COLUMN profile_photo_url VARCHAR(512) NOT NULL DEFAULT '';

