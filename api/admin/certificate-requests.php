<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

requireRole(['purple_admin']);

$result = $conn->query("SELECT * FROM certificate_requests ORDER BY request_date DESC");
$requests = [];
while ($row = $result->fetch_assoc()) {
    $requests[] = $row;
}

echo json_encode(["success" => true, "requests" => $requests]);
$conn->close();