-- Add missing tables/columns required by newer backend features.
-- This keeps production profile `ddl-auto=validate` happy on fresh Railway MySQL.

-- Candidate profile extra fields (UI personalization)
ALTER TABLE candidate_profiles
    ADD COLUMN role_title VARCHAR(120) NOT NULL DEFAULT '',
    ADD COLUMN location VARCHAR(120) NOT NULL DEFAULT '';

-- Job posting salary + attachment fields
ALTER TABLE job_postings
    ADD COLUMN min_ctc INT NOT NULL DEFAULT 0,
    ADD COLUMN max_ctc INT NOT NULL DEFAULT 0,
    ADD COLUMN ctc_currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    ADD COLUMN ctc_frequency VARCHAR(16) NOT NULL DEFAULT 'YEARLY',
    ADD COLUMN salary_hidden BIT(1) NOT NULL DEFAULT b'0',
    ADD COLUMN attachment_url VARCHAR(512) NOT NULL DEFAULT '',
    ADD COLUMN attachment_name VARCHAR(255) NOT NULL DEFAULT '';

-- Recruiter recent activity tracking
CREATE TABLE IF NOT EXISTS activities (
    id BIGINT NOT NULL AUTO_INCREMENT,
    recruiter_user_id BIGINT NOT NULL,
    type VARCHAR(32) NOT NULL,
    message VARCHAR(220) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    job_id BIGINT NULL,
    candidate_user_id BIGINT NULL,
    PRIMARY KEY (id),
    KEY idx_activities_recruiter_user_id (recruiter_user_id),
    CONSTRAINT fk_activities_recruiter_user FOREIGN KEY (recruiter_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Candidate certificates upload
CREATE TABLE IF NOT EXISTS candidate_certificates (
    id BIGINT NOT NULL AUTO_INCREMENT,
    candidate_user_id BIGINT NOT NULL,
    file_url VARCHAR(512) NOT NULL DEFAULT '',
    original_name VARCHAR(255) NOT NULL DEFAULT '',
    stored_name VARCHAR(255) NOT NULL DEFAULT '',
    content_type VARCHAR(96) NOT NULL DEFAULT '',
    size_bytes BIGINT NOT NULL DEFAULT 0,
    uploaded_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_candidate_certificates_candidate_user_id (candidate_user_id),
    CONSTRAINT fk_candidate_certificates_candidate_user FOREIGN KEY (candidate_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Interviews (shared visibility for recruiter + candidate)
CREATE TABLE IF NOT EXISTS interviews (
    id BIGINT NOT NULL AUTO_INCREMENT,
    job_id BIGINT NOT NULL,
    candidate_user_id BIGINT NOT NULL,
    recruiter_user_id BIGINT NOT NULL,
    type VARCHAR(16) NOT NULL DEFAULT 'HR',
    mode VARCHAR(16) NOT NULL DEFAULT 'ONLINE',
    status VARCHAR(16) NOT NULL DEFAULT 'SCHEDULED',
    scheduled_at TIMESTAMP(6) NOT NULL,
    meeting_link VARCHAR(512) NOT NULL DEFAULT '',
    notes VARCHAR(1000) NOT NULL DEFAULT '',
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_interviews_job_id (job_id),
    KEY idx_interviews_candidate_user_id (candidate_user_id),
    KEY idx_interviews_recruiter_user_id (recruiter_user_id),
    CONSTRAINT fk_interviews_job FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
    CONSTRAINT fk_interviews_candidate_user FOREIGN KEY (candidate_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_interviews_recruiter_user FOREIGN KEY (recruiter_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Unified notifications (candidate + recruiter)
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT NOT NULL AUTO_INCREMENT,
    recipient_user_id BIGINT NOT NULL,
    actor_user_id BIGINT NULL,
    type VARCHAR(32) NOT NULL,
    title VARCHAR(140) NOT NULL,
    description VARCHAR(1000) NOT NULL DEFAULT '',
    action_url VARCHAR(512) NOT NULL DEFAULT '',
    read_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_notifications_recipient_user_id (recipient_user_id),
    KEY idx_notifications_created_at (created_at),
    CONSTRAINT fk_notifications_recipient_user FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Candidate posts (LinkedIn-style profile additions)
CREATE TABLE IF NOT EXISTS candidate_posts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    candidate_user_id BIGINT NOT NULL,
    type VARCHAR(16) NOT NULL DEFAULT 'UPDATE',
    content VARCHAR(4000) NOT NULL DEFAULT '',
    image_url VARCHAR(512) NOT NULL DEFAULT '',
    link_url VARCHAR(512) NOT NULL DEFAULT '',
    created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_candidate_posts_candidate_user_id (candidate_user_id),
    KEY idx_candidate_posts_created_at (created_at),
    CONSTRAINT fk_candidate_posts_candidate_user FOREIGN KEY (candidate_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Daily stats snapshots
CREATE TABLE IF NOT EXISTS candidate_stats (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    applications_count BIGINT NOT NULL DEFAULT 0,
    interviews_count BIGINT NOT NULL DEFAULT 0,
    profile_views_count BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_candidate_stats_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS recruiter_stats (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    active_jobs_count BIGINT NOT NULL DEFAULT 0,
    total_applicants_count BIGINT NOT NULL DEFAULT 0,
    interviews_scheduled_count BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_recruiter_stats_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

