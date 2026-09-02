<?php
// api/auth/student-change-password.php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

requireRole(['purple_student']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);

$current_password = isset($input['current_password']) ? trim($input['current_password']) : '';
$new_password = isset($input['new_password']) ? trim($input['new_password']) : '';

if (empty($current_password) || empty($new_password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Current and new passwords are required."]);
    exit();
}

if (strlen($new_password) < 6) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "New password must be at least 6 characters long."]);
    exit();
}

// Get student ID from JWT
$student_id = $GLOBALS['jwt_data']['user_id'] ?? null;

if (!$student_id) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized."]);
    exit();
}

// Fetch student record
$stmt = $conn->prepare("SELECT password_student FROM students WHERE id_student = ?");
$stmt->bind_param("i", $student_id);
$stmt->execute();
$result = $stmt->get_result();
$student = $result->fetch_assoc();
$stmt->close();

if (!$student) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Student not found."]);
    exit();
}

// Verify current password
if (!password_verify($current_password, $student['password_student'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Current password is incorrect."]);
    exit();
}

// Hash new password
$hashed_password = password_hash($new_password, PASSWORD_BCRYPT);

// Update password
$stmt = $conn->prepare("UPDATE students SET password_student = ? WHERE id_student = ?");
$stmt->bind_param("si", $hashed_password, $student_id);
$stmt->execute();
$stmt->close();

echo json_encode([
    "success" => true,
    "message" => "Password changed successfully."
]);

$conn->close();
