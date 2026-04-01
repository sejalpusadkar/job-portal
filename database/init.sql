-- Initial schema for dockerized MySQL (matches the working local schema).
-- MySQL root password is managed by your local environment / secrets manager.

CREATE DATABASE IF NOT EXISTS job_portal_db;
USE job_portal_db;

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('CANDIDATE','RECRUITER','ADMIN') NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  `is_approved` tinyint(1) DEFAULT '0',
  `updated_at` datetime(6) DEFAULT NULL,
  `enabled` bit(1) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `recruiter_approved` bit(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `candidate_profiles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `education` varchar(255) NOT NULL,
  `experience_years` int NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `user_id` bigint NOT NULL,
  `professional_summary` varchar(2000) NOT NULL,
  `profile_photo` longtext NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_m7asead9kaplln9cdupjat1cq` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `candidate_skills` (
  `candidate_profile_id` bigint NOT NULL,
  `skill` varchar(64) NOT NULL,
  PRIMARY KEY (`candidate_profile_id`,`skill`),
  CONSTRAINT `FKth710w3978vqyonpto6hwyper` FOREIGN KEY (`candidate_profile_id`) REFERENCES `candidate_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `candidate_keywords` (
  `candidate_profile_id` bigint NOT NULL,
  `keyword` varchar(64) NOT NULL,
  PRIMARY KEY (`candidate_profile_id`,`keyword`),
  CONSTRAINT `FK9c7rhowd09gaeclfq6v0xex7j` FOREIGN KEY (`candidate_profile_id`) REFERENCES `candidate_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `recruiters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `company_name` varchar(200) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `company_address` varchar(255) DEFAULT NULL,
  `company_website` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `recruiters_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `recruiter_profiles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL,
  `contact_person` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK_gju0uv9tit5jywakidv5cgunk` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `jobs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recruiter_id` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `required_skills` text,
  `required_experience` int DEFAULT '0',
  `location` varchar(100) DEFAULT NULL,
  `salary` varchar(100) DEFAULT NULL,
  `job_type` enum('FULL_TIME','PART_TIME','REMOTE') DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `posted_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `keywords` text,
  `salary_range` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `recruiter_id` (`recruiter_id`),
  CONSTRAINT `jobs_ibfk_1` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `job_postings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `description` varchar(4000) NOT NULL,
  `min_experience_years` int NOT NULL,
  `status` enum('ACTIVE','CLOSED') NOT NULL,
  `title` varchar(120) NOT NULL,
  `recruiter_user_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `job_required_skills` (
  `job_id` bigint NOT NULL,
  `skill` varchar(64) NOT NULL,
  PRIMARY KEY (`job_id`,`skill`),
  CONSTRAINT `FKbq8fe72fxjwq3gyrsqkmaicp4` FOREIGN KEY (`job_id`) REFERENCES `job_postings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `job_keywords` (
  `job_id` bigint NOT NULL,
  `keyword` varchar(64) NOT NULL,
  PRIMARY KEY (`job_id`,`keyword`),
  CONSTRAINT `FKtduk4wgx3n1f3qypvfc6jfx30` FOREIGN KEY (`job_id`) REFERENCES `job_postings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `job_applications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `applied_at` datetime(6) NOT NULL,
  `status` enum('APPLIED','SHORTLISTED','REJECTED') NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `candidate_user_id` bigint NOT NULL,
  `job_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_application_candidate_job` (`candidate_user_id`,`job_id`),
  KEY `FKnhwwf2t406ujtc15jnbq0ugd6` (`job_id`),
  CONSTRAINT `FKnhwwf2t406ujtc15jnbq0ugd6` FOREIGN KEY (`job_id`) REFERENCES `job_postings` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `applications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `job_id` int NOT NULL,
  `candidate_id` int NOT NULL,
  `status` enum('APPLIED','SHORTLISTED','REJECTED') DEFAULT 'APPLIED',
  `applied_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `match_score` double DEFAULT NULL,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `job_id` (`job_id`,`candidate_id`),
  KEY `candidate_id` (`candidate_id`),
  CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`candidate_id`) REFERENCES `candidates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `candidates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `experience` int DEFAULT '0',
  `skills` text,
  `keywords` text,
  `education` json DEFAULT NULL,
  `experience_years` int DEFAULT NULL,
  `resume_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `candidates_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `password_reset_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `token_sha256` varchar(64) NOT NULL,
  `used_at` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
