<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

requireAuth();

$docTypes = require __DIR__ . '/../config/document-types.php';

$lrn = trim($_GET['lrn'] ?? '');
if ($lrn === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'LRN is required.']);
    exit;
}

$stmt = $conn->prepare(
    'SELECT id, document_type, purpose, request_date, status, rejection_reason
     FROM document_requests WHERE lrn = ? ORDER BY request_date DESC'
);
$stmt->bind_param('s', $lrn);
$stmt->execute();
$requests = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

foreach ($requests as &$r) {
    $r['document_type_label'] = $docTypes[$r['document_type']]['label'] ?? 'Unknown Document';
}
unset($r);

echo json_encode(['success' => true, 'requests' => $requests]);