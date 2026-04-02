-- Hibernate expects MySQL ENUM for candidate_posts.type with these values.
-- Use case-insensitive collation so Java enum names (ACHIEVEMENT, ...) still persist correctly.

ALTER TABLE candidate_posts
    MODIFY COLUMN type ENUM('achievement','certification','project','update') NOT NULL DEFAULT 'update';

