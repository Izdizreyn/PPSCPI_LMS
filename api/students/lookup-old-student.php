<?php
// api/students/lookup-old-student.php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$lrn = trim($_GET['lrn'] ?? '');
$birthday = trim($_GET['birthday'] ?? '');

if (empty($lrn) || empty($birthday)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "LRN and birthday are required."]);
    exit();
}

// Require BOTH lrn and birthday to match — LRNs alone aren't secret
// (printed on report cards/IDs), so pairing with a second identifying
// field prevents this endpoint from being used to enumerate student PII.
$stmt = $conn->prepare("SELECT * FROM student_master_records WHERE lrn = ? AND birthday = ?");
$stmt->bind_param("ss", $lrn, $birthday);
$stmt->execute();
$record = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$record) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "No matching record found. Please fill out the form manually."]);
    exit();
}

echo json_encode(["success" => true, "data" => $record]);

$conn->close();