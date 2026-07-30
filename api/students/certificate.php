<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$requestId = $_GET['id'] ?? '';

if (empty($requestId)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Request ID not provided."]);
    exit();
}

$stmt = $conn->prepare("SELECT * FROM certificate_requests WHERE id = ? AND status = 'Approved'");
$stmt->bind_param("i", $requestId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Certificate request not found or not approved."]);
    exit();
}

$row = $result->fetch_assoc();
$stmt->close();

$schoolResult = $conn->query("SELECT * FROM school_info LIMIT 1");
$schoolInfo = $schoolResult->num_rows > 0 ? $schoolResult->fetch_assoc() : [
    'school_name' => 'PPSCPI',
    'school_address' => 'School Address',
    'school_contact' => 'School Contact',
    'principal_name' => 'School Principal',
];

// Generate certificate number if not already set
$certificateNumber = $row['certificate_number'];
if (empty($certificateNumber)) {
    $certificateNumber = 'COE-' . date('Y') . '-' . str_pad($requestId, 5, '0', STR_PAD_LEFT);
    $updateStmt = $conn->prepare("UPDATE certificate_requests SET certificate_number = ? WHERE id = ?");
    $updateStmt->bind_param("si", $certificateNumber, $requestId);
    $updateStmt->execute();
    $updateStmt->close();
}

echo json_encode([
    "success" => true,
    "request" => $row,
    "school" => $schoolInfo,
    "certificate_number" => $certificateNumber,
    "current_date" => date("F d, Y"),
    "school_year" => date('Y') . '-' . (date('Y') + 1),
]);

$conn->close();