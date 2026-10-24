<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$user = requireRole(['purple_teacher']);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit();
}

$body = json_decode(file_get_contents('php://input'), true) ?? [];
$currentPassword = (string) ($body['current_password'] ?? '');
$newPassword = (string) ($body['new_password'] ?? '');
$teacherId = (int) ($user['user_id'] ?? 0);

if ($currentPassword === '' || strlen($newPassword) < 8 || strlen($newPassword) > 255) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Enter the current password and a new password of at least 8 characters.']);
    exit();
}

$stmt = $conn->prepare('SELECT password_admin FROM admin WHERE id_admin = ? AND role = "purple_teacher" LIMIT 1');
$stmt->bind_param('i', $teacherId);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

$storedPassword = (string) ($row['password_admin'] ?? '');
$validPassword = $storedPassword !== '' &&
    (password_verify($currentPassword, $storedPassword) || hash_equals($storedPassword, $currentPassword));
if (!$validPassword) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'The current password is incorrect.']);
    exit();
}

$newHash = password_hash($newPassword, PASSWORD_DEFAULT);
$stmt = $conn->prepare('UPDATE admin SET password_admin = ? WHERE id_admin = ? AND role = "purple_teacher"');
$stmt->bind_param('si', $newHash, $teacherId);
$stmt->execute();
$stmt->close();

echo json_encode(['success' => true, 'message' => 'Password updated successfully.']);
$conn->close();
