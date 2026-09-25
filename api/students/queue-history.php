<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$user = requireRole(['purple_student']);

$lrn = $user['lrn'] ?? null;
if (empty($lrn)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "No LRN found for this account."]);
    exit();
}

$stmt = $conn->prepare("SELECT * FROM enrollment_schedule WHERE lrn = ? ORDER BY enrollment_date DESC");
$stmt->bind_param("s", $lrn);
$stmt->execute();
$result = $stmt->get_result();
$queues = [];
while ($row = $result->fetch_assoc()) {
    $queues[] = $row;
}
$stmt->close();

// Attach transaction details for queues that were actually used for a payment
$stmt = $conn->prepare("SELECT * FROM queue_usage_log WHERE lrn = ? ORDER BY recorded_at DESC");
$stmt->bind_param("s", $lrn);
$stmt->execute();
$result = $stmt->get_result();
$usageByQueue = [];
while ($row = $result->fetch_assoc()) {
    $usageByQueue[$row['queue_number']][] = $row;
}
$stmt->close();

foreach ($queues as &$q) {
    $q['transactions'] = $usageByQueue[$q['queue_number']] ?? [];
}
unset($q);

echo json_encode(["success" => true, "queues" => $queues]);
$conn->close();