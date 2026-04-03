-- Fix incorrect users.role ENUM casing.
-- V10 created ENUM('candidate','recruiter','admin') which causes JPA EnumType.STRING to fail
-- when reading values into com.jobportal.user.Role (CANDIDATE/RECRUITER/ADMIN).

UPDATE users
SET role = UPPER(role)
WHERE role IN ('candidate', 'recruiter', 'admin');

ALTER TABLE users
    MODIFY COLUMN role ENUM('CANDIDATE','RECRUITER','ADMIN') NOT NULL;

