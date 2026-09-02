<?php
// api/auth/student-register.php
// Internal endpoint for creating student accounts after approval

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
$lrn = isset($input['lrn']) ? trim($input['lrn']) : '';
$full_name = isset($input['full_name']) ? trim($input['full_name']) : '';

if (empty($email) || empty($password) || empty($lrn)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email, password, and LRN are required."]);
    exit();
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid email format."]);
    exit();
}

// Check if email already exists
$stmt = $conn->prepare("SELECT id_student FROM students WHERE email_student = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
if ($stmt->get_result()->num_rows > 0) {
    $stmt->close();
    http_response_code(409);
    echo json_encode(["success" => false, "message" => "Email already registered."]);
    exit();
}
$stmt->close();

// Check if LRN already exists
$stmt = $conn->prepare("SELECT id_student FROM students WHERE lrn = ?");
$stmt->bind_param("s", $lrn);
$stmt->execute();
if ($stmt->get_result()->num_rows > 0) {
    $stmt->close();
    http_response_code(409);
    echo json_encode(["success" => false, "message" => "Student account already exists for this LRN."]);
    exit();
}
$stmt->close();

// Hash the password
$hashed_password = password_hash($password, PASSWORD_BCRYPT);

// Insert student account
$stmt = $conn->prepare("INSERT INTO students (email_student, password_student, lrn, full_name, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
$stmt->bind_param("sssss", $email, $hashed_password, $lrn, $full_name, $role = 'purple_student');
$stmt->execute();
$student_id = $stmt->insert_id;
$stmt->close();

if ($student_id > 0) {
    echo json_encode([
        "success" => true,
        "message" => "Student account created successfully.",
        "student" => [
            "id" => $student_id,
            "email" => $email,
            "lrn" => $lrn,
            "full_name" => $full_name,
            "role" => "purple_student"
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to create student account."]);
}

$conn->close();
