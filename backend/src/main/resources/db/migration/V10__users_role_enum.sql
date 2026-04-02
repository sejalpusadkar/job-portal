-- Hibernate expects a MySQL ENUM for users.role (Role enum).

ALTER TABLE users
    MODIFY COLUMN role ENUM('candidate','recruiter','admin') NOT NULL;

