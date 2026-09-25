<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

requireRole(['purple_admin']);

$body = json_decode(file_get_contents('php://input'), true) ?? [];
$id = $body['id'] ?? null;
$action = $body['action'] ?? '';
$reason = trim($body['reason'] ?? '');

if (!$id || !in_array($action, ['approve', 'reject'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid request.']);
    exit;
}

if ($action === 'reject' && $reason === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'A reason is required to reject a request.']);
    exit;
}

if ($action === 'approve') {
    $stmt = $conn->prepare('UPDATE document_requests SET status = "Approved", rejection_reason = NULL WHERE id = ?');
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->close();
    $message = 'Request approved.';
} else {
    $stmt = $conn->prepare('UPDATE document_requests SET status = "Rejected", rejection_reason = ? WHERE id = ?');
    $stmt->bind_param('si', $reason, $id);
    $stmt->execute();
    $stmt->close();
    $message = 'Request rejected.';
}

echo json_encode(['success' => true, 'message' => $message]);