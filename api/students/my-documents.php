<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$user = requireRole(['purple_student']);
$studentId = (int) ($user['user_id'] ?? 0);
$storageDirectory = __DIR__ . '/../private_uploads/student-documents';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['view'])) {
        $documentId = filter_var($_GET['view'], FILTER_VALIDATE_INT);
        if (!$documentId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid document id.']);
            exit;
        }

        $stmt = $conn->prepare(
            'SELECT original_name, stored_name, mime_type FROM student_documents WHERE id = ? AND student_id = ? LIMIT 1'
        );
        $stmt->bind_param('ii', $documentId, $studentId);
        $stmt->execute();
        $document = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$document) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Document not found.']);
            exit;
        }

        $storedName = basename($document['stored_name']);
        $filePath = $storageDirectory . DIRECTORY_SEPARATOR . $storedName;
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
        exit;
    }

    $stmt = $conn->prepare(
        'SELECT id, category, original_name, mime_type, file_size, uploaded_at
         FROM student_documents WHERE student_id = ? ORDER BY uploaded_at DESC, id DESC'
    );
    $stmt->bind_param('i', $studentId);
    $stmt->execute();
    $documents = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode(['success' => true, 'documents' => $documents]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

if (!isset($_FILES['document']) || $_FILES['document']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Select a document to upload.']);
    exit;
}

$categories = [
    'id_photo' => '2x2 ID Photo',
    'birth_certificate' => 'Birth Certificate',
    'report_card' => 'Report Card',
    'form_137' => 'Form 137',
    'good_morale' => 'Certificate of Good Morale',
    'certificate_of_enrollment' => 'Certificate of Enrollment',
    'transcript' => 'Transcript of Records',
    'other' => 'Other Document',
];
$category = $_POST['category'] ?? '';
if (!is_string($category) || !array_key_exists($category, $categories)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Select a valid document category.']);
    exit;
}

$file = $_FILES['document'];
$maxFileSize = 10 * 1024 * 1024;
if ($file['size'] < 1 || $file['size'] > $maxFileSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Documents must be smaller than 10 MB.']);
    exit;
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);
$allowedTypes = [
    'application/pdf' => 'pdf',
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
];
if (!isset($allowedTypes[$mimeType])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Only PDF, JPEG, and PNG documents are supported.']);
    exit;
}
if ($category === 'id_photo' && !in_array($mimeType, ['image/jpeg', 'image/png'], true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'The 2x2 ID photo must be a JPEG or PNG image.']);
    exit;
}

if (!is_dir($storageDirectory) && !mkdir($storageDirectory, 0750, true) && !is_dir($storageDirectory)) {
    error_log('Unable to create private student document storage directory.');
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Document storage is unavailable.']);
    exit;
}

$storedName = bin2hex(random_bytes(16)) . '.' . $allowedTypes[$mimeType];
$destination = $storageDirectory . DIRECTORY_SEPARATOR . $storedName;
if (!move_uploaded_file($file['tmp_name'], $destination)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'The document could not be stored.']);
    exit;
}

$originalName = basename(str_replace('\\', '/', $file['name']));
$originalName = mb_substr(preg_replace('/[\x00-\x1F\x7F]/u', '', $originalName), 0, 255);
try {
    $conn->begin_transaction();
    $existingStmt = $conn->prepare(
        'SELECT id, stored_name FROM student_documents
         WHERE student_id = ? AND category = ? FOR UPDATE'
    );
    $existingStmt->bind_param('is', $studentId, $category);
    $existingStmt->execute();
    $existingDocuments = $existingStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $existingStmt->close();

    $stmt = $conn->prepare(
        'INSERT INTO student_documents (student_id, category, original_name, stored_name, mime_type, file_size)
         VALUES (?, ?, ?, ?, ?, ?)'
    );
    $stmt->bind_param('issssi', $studentId, $category, $originalName, $storedName, $mimeType, $file['size']);
    $stmt->execute();
    $documentId = $stmt->insert_id;
    $stmt->close();

    $replaced = !empty($existingDocuments);
    if ($replaced) {
        $deleteStmt = $conn->prepare(
            'DELETE FROM student_documents WHERE student_id = ? AND category = ? AND id <> ?'
        );
        $deleteStmt->bind_param('isi', $studentId, $category, $documentId);
        $deleteStmt->execute();
        $deleteStmt->close();
    }

    $activity = 'Uploaded or replaced ' . $categories[$category];
    $activityStmt = $conn->prepare('INSERT INTO student_activity (student_id, activity) VALUES (?, ?)');
    $activityStmt->bind_param('is', $studentId, $activity);
    $activityStmt->execute();
    $activityStmt->close();
    $conn->commit();
} catch (mysqli_sql_exception $exception) {
    $conn->rollback();
    unlink($destination);
    error_log('Unable to register student document or activity: ' . $exception->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'The document could not be saved.']);
    exit;
}

foreach ($existingDocuments ?? [] as $existingDocument) {
    $oldPath = $storageDirectory . DIRECTORY_SEPARATOR . basename($existingDocument['stored_name']);
    if (is_file($oldPath)) {
        unlink($oldPath);
    }
}

echo json_encode([
    'success' => true,
    'message' => $replaced
        ? 'Document uploaded successfully and replaced the previous file in this category.'
        : 'Document uploaded successfully.',
    'document' => [
        'id' => $documentId,
        'category' => $category,
        'category_label' => $categories[$category],
        'original_name' => $originalName,
        'mime_type' => $mimeType,
        'file_size' => (int) $file['size'],
        'uploaded_at' => date('Y-m-d H:i:s'),
    ],
]);
