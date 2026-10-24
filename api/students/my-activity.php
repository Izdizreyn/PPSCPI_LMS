<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$user = requireRole(['purple_student']);
$studentId = (int) ($user['user_id'] ?? 0);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$stmt = $conn->prepare(
    'SELECT id, activity, created_at
     FROM student_activity WHERE student_id = ?
     ORDER BY created_at DESC, id DESC LIMIT 50'
);
$stmt->bind_param('i', $studentId);
$stmt->execute();
$activities = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

echo json_encode(['success' => true, 'activities' => $activities]);
