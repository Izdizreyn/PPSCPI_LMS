<?php
// api/migration.php
// Auto-migration script to create students table
// Run this once: visit http://localhost/ppscpi_lms/api/migration.php

require_once __DIR__ . '/config/database.php';

try {
    $sql = "CREATE TABLE IF NOT EXISTS `students` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    if ($conn->query($sql) === TRUE) {
        echo json_encode([
            "success" => true,
            "message" => "Students table created successfully!"
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "Error creating table: " . $conn->error
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => "Migration failed: " . $e->getMessage()
    ]);
}

$conn->close();
