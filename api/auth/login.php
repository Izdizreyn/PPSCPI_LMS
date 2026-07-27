<?php
// api/auth/login.php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);

$username = isset($input['username']) ? trim($input['username']) : '';
$password = isset($input['password']) ? trim($input['password']) : '';

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Username and password are required."]);
    exit();
}

$stmt = $conn->prepare("SELECT id_admin, username_admin, password_admin, role FROM admin WHERE username_admin = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$stmt->close();

if (!$row || $password !== $row["password_admin"]) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid username or password."]);
    exit();
}

$token = generateJWT([
    "user_id" => $row["id_admin"],
    "username" => $row["username_admin"],
    "role" => $row["role"],
]);

echo json_encode([
    "success" => true,
    "message" => "Login successful.",
    "token" => $token,
    "user" => [
        "id" => $row["id_admin"],
        "username" => $row["username_admin"],
        "role" => $row["role"],
    ]
]);

$conn->close();