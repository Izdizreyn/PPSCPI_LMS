<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

requireRole(['purple_admin']);

$docTypes = require __DIR__ . '/../config/document-types.php';

$result = $conn->query(
    'SELECT id, full_name, lrn, year_level, level, strand, room, purpose,
            document_type, request_date, status, rejection_reason
     FROM document_requests
     ORDER BY FIELD(status, "Pending", "Approved", "Rejected"), request_date DESC'
);
$requests = $result->fetch_all(MYSQLI_ASSOC);

foreach ($requests as &$r) {
    $r['document_type_label'] = $docTypes[$r['document_type']]['label'] ?? 'Unknown Document';
    $r['system_generated'] = $docTypes[$r['document_type']]['system_generated'] ?? false;
}
unset($r);

echo json_encode(['success' => true, 'requests' => $requests]);