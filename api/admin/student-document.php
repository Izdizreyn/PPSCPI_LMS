<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

requireRole(['purple_admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$documentId = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
if (!$documentId) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid document id.']);
    exit;
}

$stmt = $conn->prepare(
    'SELECT original_name, stored_name, mime_type
     FROM student_documents WHERE id = ? LIMIT 1'
);
$stmt->bind_param('i', $documentId);
$stmt->execute();
$document = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$document) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Document not found.']);
    exit;
}

$storedName = basename($document['stored_name']);
$filePath = __DIR__ . '/../private_uploads/student-documents/' . $storedName;
if (!is_file($filePath)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Stored document file was not found.']);
    exit;
}

$documentName = preg_replace('/[\r\n"]/', '', basename($document['original_name']));
header_remove('Content-Type');
header('Content-Type: ' . $document['mime_type']);
header('Content-Length: ' . filesize($filePath));
header("Content-Disposition: inline; filename*=UTF-8''" . rawurlencode($documentName));
readfile($filePath);
