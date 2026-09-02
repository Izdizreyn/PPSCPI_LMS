-- Migration: Create students table for student accounts
-- Run this SQL in phpMyAdmin or MySQL CLI against the purple_db database

CREATE TABLE IF NOT EXISTS `students` (
  `id_student` INT AUTO_INCREMENT PRIMARY KEY,
  `email_student` VARCHAR(255) NOT NULL UNIQUE,
  `password_student` VARCHAR(255) NOT NULL,
  `lrn` VARCHAR(15) NOT NULL UNIQUE,
  `full_name` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'purple_student',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email_student),
  INDEX idx_lrn (lrn)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
