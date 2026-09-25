<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$docTypes = require __DIR__ . '/../config/document-types.php';
$id = $_GET['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing request id.']);
    exit;
}

$stmt = $conn->prepare('SELECT * FROM document_requests WHERE id = ? AND status = "Approved"');
$stmt->bind_param('i', $id);
$stmt->execute();
$request = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$request) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Request not found or not approved.']);
    exit;
}

$typeMeta = $docTypes[$request['document_type']] ?? [
    'label' => 'Unknown Document',
    'title' => 'DOCUMENT CERTIFICATION',
    'paragraphs' => ['This is to certify an approved document request for {full_name}, LRN {lrn}.'],
];

$yearSection = trim($request['year_level']);
if (!empty($request['strand'])) {
    $yearSection .= ' - ' . $request['strand'];
}
if (!empty($request['room'])) {
    $yearSection .= ' (Room ' . $request['room'] . ')';
}

$schoolYear = date('Y') . '-' . (date('Y') + 1);

$day = date('j');
$daySuffix = (function ($d) {
    if (in_array($d % 100, [11, 12, 13])) return 'th';
    switch ($d % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
})((int) $day);
$issueDate = $day . $daySuffix . ' day of ' . date('F') . ', ' . date('Y');

$placeholders = [
    '{full_name}'    => strtoupper($request['full_name']),
    '{lrn}'          => $request['lrn'],
    '{level}'        => $request['level'],
    '{year_section}' => $yearSection,
    '{school_year}'  => $schoolYear,
    '{issue_date}'   => $issueDate,
];

$paragraphs = array_map(
    fn($p) => strtr($p, $placeholders),
    $typeMeta['paragraphs']
);

$schoolResult = $conn->query('SELECT * FROM school_info LIMIT 1');
$school = $schoolResult ? $schoolResult->fetch_assoc() : null;

$prefix = strtoupper(substr($request['document_type'], 0, 3));

echo json_encode([
    'success' => true,
    'request' => $request,
    'document_type_label' => $typeMeta['label'],
    'title' => $typeMeta['title'],
    'paragraphs' => $paragraphs,
    'school' => $school,
    'certificate_number' => $prefix . '-' . date('Y') . '-' . str_pad($request['id'], 4, '0', STR_PAD_LEFT),
]);