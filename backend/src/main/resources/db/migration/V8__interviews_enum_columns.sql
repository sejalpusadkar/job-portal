-- Hibernate expects MySQL ENUM columns for Interview enums.

ALTER TABLE interviews
    MODIFY COLUMN type ENUM('hr','technical') NOT NULL DEFAULT 'hr',
    MODIFY COLUMN mode ENUM('online','onsite') NOT NULL DEFAULT 'online',
    MODIFY COLUMN status ENUM('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled';

