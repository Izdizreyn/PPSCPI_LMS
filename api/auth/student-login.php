<?php
// api/auth/student-login.php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);

$email = isset($input['email']) ? filter_var($input['email'], FILTER_SANITIZE_EMAIL) : '';
$password = isset($input['password']) ? trim($input['password']) : '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email and password are required."]);
    exit();
}

$stmt = $conn->prepare("SELECT id_student, email_student, password_student, lrn, full_name, role FROM students WHERE email_student = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$student = $result->fetch_assoc();
$stmt->close();

if (!$student || !password_verify($password, $student["password_student"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid email or password."]);
    exit();
}

$token = generateJWT([
    "user_id" => $student["id_student"],
    "email" => $student["email_student"],
    "lrn" => $student["lrn"],
    "username" => $student["email_student"],
    "role" => $student["role"],
]);

echo json_encode([
    "success" => true,
    "message" => "Login successful.",
    "token" => $token,
    "user" => [
        "id" => $student["id_student"],
        "email" => $student["email_student"],
        "lrn" => $student["lrn"],
        "full_name" => $student["full_name"],
        "role" => $student["role"],
    ]
]);

$conn->close();
