<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/sms_helper.php';

requireRole(['purple_admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

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

$smsResult = null;

if ($action === 'approve') {
    $requestStmt = $conn->prepare(
        'SELECT full_name, lrn, purpose FROM document_requests WHERE id = ? AND status = "Pending" LIMIT 1'
    );
    $requestStmt->bind_param('i', $id);
    $requestStmt->execute();
    $request = $requestStmt->get_result()->fetch_assoc();
    $requestStmt->close();

    if (!$request) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Request not found or no longer pending.',
        ]);
        exit;
    }

    $stmt = $conn->prepare('UPDATE document_requests SET status = "Approved", rejection_reason = NULL WHERE id = ? AND status = "Pending"');
    $stmt->bind_param('i', $id);
    if (!$stmt->execute()) {
        $stmt->close();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Could not approve the request.']);
        exit;
    }
    $updated = $stmt->affected_rows === 1;
    $stmt->close();

    if (!$updated) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Request is no longer pending.',
        ]);
        exit;
    }

    $phone = findPhoneByLrn($conn, $request['lrn']);
    $smsResult = $phone
        ? sendDocumentReadySms($phone, $request['full_name'], $request['purpose'])
        : ['success' => false, 'message' => 'No phone number found for this student.'];

    $message = 'Request approved.';
} else {
    $stmt = $conn->prepare('UPDATE document_requests SET status = "Rejected", rejection_reason = ? WHERE id = ?');
    $stmt->bind_param('si', $reason, $id);
    if (!$stmt->execute()) {
        $stmt->close();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Could not reject the request.']);
        exit;
    }
    $stmt->close();
    $message = 'Request rejected.';
}

// JSON_INVALID_UTF8_SUBSTITUTE: a student's name/purpose text can contain
// bytes that aren't valid UTF-8 (pasted smart quotes, emoji, or a DB
// connection not explicitly set to utf8mb4). Without this flag,
// json_encode() silently returns false on invalid UTF-8, PHP echoes an
// empty string, and the frontend ends up parsing nothing — which reads on
// screen as "undefined ... No phone number found" regardless of what
// actually happened. This makes the response degrade gracefully instead.
$payload = json_encode([
    'success' => true,
    'message' => $message,
    'sms_sent' => $smsResult['success'] ?? false,
    'sms_message' => $smsResult['message'] ?? 'No SMS attempt was made.',
], JSON_INVALID_UTF8_SUBSTITUTE);

if ($payload === false) {
    // Still failed for a reason other than invalid UTF-8 — report it
    // instead of returning an empty body.
    http_response_code(500);
    echo json_encode([
        'success' => true,
        'message' => $message . ' (response encoding warning: ' . json_last_error_msg() . ')',
        'sms_sent' => $smsResult['success'] ?? false,
        'sms_message' => $smsResult['message'] ?? 'No SMS attempt was made.',
    ]);
    exit;
}

echo $payload;