<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

requireRole(['purple_admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);
$id = $input['id'] ?? '';
$action = $input['action'] ?? '';

if (empty($id) || !in_array($action, ['approve', 'reject'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid id or action."]);
    exit();
}

$status = $action === 'approve' ? 'Approved' : 'Rejected';

$stmt = $conn->prepare("UPDATE certificate_requests SET status = ?, processed_date = NOW() WHERE id = ?");
$stmt->bind_param("si", $status, $id);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Request $status successfully!"]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error updating request: " . $conn->error]);
}

$stmt->close();
$conn->close();