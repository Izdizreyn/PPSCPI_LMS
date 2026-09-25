<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$docTypes = require __DIR__ . '/../config/document-types.php';
$body = json_decode(file_get_contents('php://input'), true) ?? [];

$lrn = trim($body['lrn'] ?? '');
$documentType = trim($body['document_type'] ?? '');
$purpose = trim($body['purpose'] ?? '');

if ($lrn === '' || $purpose === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'LRN and purpose are required.']);
    exit;
}

if (!array_key_exists($documentType, $docTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid document type selected.']);
    exit;
}

$hasManualData = isset($body['year_level'], $body['room'], $body['level']);

if ($hasManualData) {
    // Manual entry only ever needs to supply the fields enrolled_students would
    // have carried. full_name comes from the manual payload only if the student
    // truly isn't in `students` either (walk-in/unregistered requester).
    $fullName = trim($body['full_name'] ?? '');
    $yearLevel = trim($body['year_level']);
    $strand = trim($body['strand'] ?? '');
    $room = trim($body['room']);
    $level = trim($body['level']);

    if ($fullName === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Full name is required.']);
        exit;
    }
} else {
    // 1. Prefer enrolled_students — it has everything we need in one row.
    $stmt = $conn->prepare(
        'SELECT full_name, year_level, strand, room, level FROM enrolled_students WHERE lrn = ? LIMIT 1'
    );
    $stmt->bind_param('s', $lrn);
    $stmt->execute();
    $student = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($student) {
        $fullName = $student['full_name'];
        $yearLevel = $student['year_level'];
        $strand = $student['strand'];
        $room = $student['room'];
        $level = $student['level'];
    } else {
        // 2. Not room-assigned yet — but they may still hold a valid portal
        // account. Check `students` so we at least know their real name and
        // can ask for only the missing enrollment-specific fields.
        $stmt = $conn->prepare('SELECT full_name FROM students WHERE lrn = ? LIMIT 1');
        $stmt->bind_param('s', $lrn);
        $stmt->execute();
        $account = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        http_response_code(404);
        echo json_encode([
            'success' => false,
            'student_not_found' => true,
            'known_full_name' => $account['full_name'] ?? null,
            'message' => $account
                ? 'You are not yet assigned to a room/section. Please provide your year level, strand, and room so we can process this request.'
                : 'No student account found with that LRN. Please fill in your details manually.',
        ]);
        exit;
    }
}

$stmt = $conn->prepare(
    'INSERT INTO document_requests
        (full_name, lrn, year_level, level, strand, room, purpose, document_type, request_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), "Pending")'
);
$stmt->bind_param('ssssssss', $fullName, $lrn, $yearLevel, $level, $strand, $room, $purpose, $documentType);
$stmt->execute();
$stmt->close();

echo json_encode([
    'success' => true,
    'message' => $docTypes[$documentType]['label'] . ' request submitted. You will be notified once it is reviewed.',
]);