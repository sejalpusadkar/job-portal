-- Flyway migration: initialize the single, canonical schema used by this app.
-- This intentionally does NOT create legacy duplicate tables like: jobs, candidates, recruiters, applications.

CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  email VARCHAR(254) NOT NULL,
  -- Keep both columns to stay compatible with existing local DBs that still have `password` NOT NULL.
  password VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(16) NOT NULL,
  enabled BIT(1) NOT NULL,
  recruiter_approved BIT(1) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS candidate_profiles (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  education VARCHAR(255) NOT NULL,
  experience_years INT NOT NULL,
  professional_summary VARCHAR(2000) NOT NULL,
  profile_photo LONGTEXT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_candidate_profiles_user_id (user_id),
  CONSTRAINT fk_candidate_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS candidate_skills (
  candidate_profile_id BIGINT NOT NULL,
  skill VARCHAR(64) NOT NULL,
  PRIMARY KEY (candidate_profile_id, skill),
  CONSTRAINT fk_candidate_skills_profile FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS candidate_keywords (
  candidate_profile_id BIGINT NOT NULL,
  keyword VARCHAR(64) NOT NULL,
  PRIMARY KEY (candidate_profile_id, keyword),
  CONSTRAINT fk_candidate_keywords_profile FOREIGN KEY (candidate_profile_id) REFERENCES candidate_profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS recruiter_profiles (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_recruiter_profiles_user_id (user_id),
  CONSTRAINT fk_recruiter_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS job_postings (
  id BIGINT NOT NULL AUTO_INCREMENT,
  recruiter_user_id BIGINT NOT NULL,
  title VARCHAR(120) NOT NULL,
  description VARCHAR(4000) NOT NULL,
  min_experience_years INT NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_job_postings_recruiter_user_id (recruiter_user_id),
  CONSTRAINT fk_job_postings_recruiter_user FOREIGN KEY (recruiter_user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS job_required_skills (
  job_id BIGINT NOT NULL,
  skill VARCHAR(64) NOT NULL,
  PRIMARY KEY (job_id, skill),
  CONSTRAINT fk_job_required_skills_job FOREIGN KEY (job_id) REFERENCES job_postings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS job_keywords (
  job_id BIGINT NOT NULL,
  keyword VARCHAR(64) NOT NULL,
  PRIMARY KEY (job_id, keyword),
  CONSTRAINT fk_job_keywords_job FOREIGN KEY (job_id) REFERENCES job_postings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS job_applications (
  id BIGINT NOT NULL AUTO_INCREMENT,
  candidate_user_id BIGINT NOT NULL,
  job_id BIGINT NOT NULL,
  status VARCHAR(16) NOT NULL,
  applied_at TIMESTAMP(6) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_application_candidate_job (candidate_user_id, job_id),
  KEY idx_job_applications_job_id (job_id),
  KEY idx_job_applications_candidate_user_id (candidate_user_id),
  CONSTRAINT fk_job_applications_candidate_user FOREIGN KEY (candidate_user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_job_applications_job FOREIGN KEY (job_id) REFERENCES job_postings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  token_sha256 VARCHAR(64) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL,
  expires_at TIMESTAMP(6) NOT NULL,
  used_at TIMESTAMP(6) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_password_reset_tokens_user_id (user_id),
  CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
