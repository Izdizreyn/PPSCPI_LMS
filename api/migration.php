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
        $documentsSql = "CREATE TABLE IF NOT EXISTS `student_documents` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `student_id` INT NOT NULL,
            `category` VARCHAR(50) NOT NULL DEFAULT 'other',
            `original_name` VARCHAR(255) NOT NULL,
            `stored_name` VARCHAR(64) NOT NULL,
            `mime_type` VARCHAR(100) NOT NULL,
            `file_size` INT UNSIGNED NOT NULL,
            `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_student_documents_student_category (student_id, category),
            INDEX idx_student_documents_student_uploaded (student_id, uploaded_at),
            CONSTRAINT fk_student_documents_student
                FOREIGN KEY (student_id) REFERENCES students(id_student) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

        if ($conn->query($documentsSql) === TRUE) {
            $columnResult = $conn->query("SHOW COLUMNS FROM `student_documents` LIKE 'category'");
            if (!$columnResult) {
                throw new Exception("Unable to inspect student document columns: " . $conn->error);
            }
            if ($columnResult->num_rows === 0 && !$conn->query("ALTER TABLE `student_documents` ADD COLUMN `category` VARCHAR(50) NOT NULL DEFAULT 'other' AFTER `student_id`")) {
                throw new Exception("Unable to add student document categories: " . $conn->error);
            }

            $indexResult = $conn->query("SHOW INDEX FROM `student_documents` WHERE Key_name = 'idx_student_documents_student_category'");
            if (!$indexResult) {
                throw new Exception("Unable to inspect student document indexes: " . $conn->error);
            }
            if ($indexResult->num_rows === 0 && !$conn->query("ALTER TABLE `student_documents` ADD INDEX `idx_student_documents_student_category` (`student_id`, `category`)")) {
                throw new Exception("Unable to add student document category index: " . $conn->error);
            }

            $activitySql = "CREATE TABLE IF NOT EXISTS `student_activity` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `student_id` INT NOT NULL,
                `activity` VARCHAR(255) NOT NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_student_activity_student_created (student_id, created_at),
                CONSTRAINT fk_student_activity_student
                    FOREIGN KEY (student_id) REFERENCES students(id_student) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

            if (!$conn->query($activitySql)) {
                http_response_code(500);
                echo json_encode([
                    "success" => false,
                    "message" => "Error creating student activity log: " . $conn->error
                ]);
                $conn->close();
                exit;
            }

            echo json_encode([
                "success" => true,
                "message" => "Student profile, document, and activity tables are ready."
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Error creating student document storage: " . $conn->error
            ]);
        }
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
