<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$user = requireRole(['purple_student']);
$studentId = (int) ($user['user_id'] ?? 0);

$accountStmt = $conn->prepare('SELECT lrn, full_name, email_student FROM students WHERE id_student = ? LIMIT 1');
$accountStmt->bind_param('i', $studentId);
$accountStmt->execute();
$account = $accountStmt->get_result()->fetch_assoc();
$accountStmt->close();

if (!$account) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Student account not found.']);
    exit;
}

$studentTypes = [
    'new' => [
        'info' => 'new_student_info',
        'info_id' => 'id_new',
        'lrn' => 'lrn_new',
        'suffix' => '_new',
        'address' => 'new_student_address',
        'address_id' => 'id_add_new',
        'parent' => 'new_student_parent',
        'parent_id' => 'id_par_new',
        'requirements' => 'new_student_req',
        'requirements_id' => 'id_req_new',
        'photo' => 'id_pic_new',
        'documents' => [
            'id_pic_new' => ['category' => 'id_photo', 'label' => '2x2 ID Photo'],
            'report_card_new' => ['category' => 'report_card', 'label' => 'Report Card'],
            'form_137_new' => ['category' => 'form_137', 'label' => 'Form 137'],
            'gmorale_new' => ['category' => 'good_morale', 'label' => 'Certificate of Good Morale'],
        ],
    ],
    'old' => [
        'info' => 'old_student_info',
        'info_id' => 'id_old',
        'lrn' => 'lrn_old',
        'suffix' => '_old',
        'address' => 'old_student_address',
        'address_id' => 'id_old_add',
        'parent' => 'old_student_parent',
        'parent_id' => 'id_par_old',
        'requirements' => 'old_student_req',
        'requirements_id' => 'id_req_old',
        'photo' => 'id_pic_old',
        'documents' => [
            'id_pic_old' => ['category' => 'id_photo', 'label' => '2x2 ID Photo'],
        ],
    ],
    'transferee' => [
        'info' => 'transferee_info',
        'info_id' => 'id_trans',
        'lrn' => 'lrn_trans',
        'suffix' => '_trans',
        'address' => 'transferee_address',
        'address_id' => 'id_add_trans',
        'parent' => 'transferee_parent',
        'parent_id' => 'id_par_trans',
        'requirements' => 'transferee_req',
        'requirements_id' => 'id_req_trans',
        'photo' => 'id_pic_trans',
        'documents' => [
            'form137_trans' => ['category' => 'form_137', 'label' => 'Form 137'],
            'gmorale_trans' => ['category' => 'good_morale', 'label' => 'Certificate of Good Morale'],
            'cert_trans' => ['category' => 'certificate_of_enrollment', 'label' => 'Certificate of Enrollment'],
            'tor_trans' => ['category' => 'transcript', 'label' => 'Transcript of Records'],
        ],
    ],
];

$intake = null;
$intakeType = null;
$intakeTable = null;
foreach ($studentTypes as $type => $tables) {
    $stmt = $conn->prepare("SELECT * FROM {$tables['info']} WHERE {$tables['lrn']} = ? LIMIT 1");
    $stmt->bind_param('s', $account['lrn']);
    $stmt->execute();
    $intake = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if ($intake) {
        $intakeType = $type;
        $intakeTable = $tables;
        break;
    }
}

if (!$intake || !$intakeTable || !$intakeType) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Enrollment information was not found for this student.']);
    exit;
}

$intakeId = (int) $intake[$intakeTable['info_id']];
$suffix = $intakeTable['suffix'];

$addressStmt = $conn->prepare("SELECT * FROM {$intakeTable['address']} WHERE {$intakeTable['address_id']} = ? LIMIT 1");
$addressStmt->bind_param('i', $intakeId);
$addressStmt->execute();
$address = $addressStmt->get_result()->fetch_assoc() ?: [];
$addressStmt->close();

$parentStmt = $conn->prepare("SELECT * FROM {$intakeTable['parent']} WHERE {$intakeTable['parent_id']} = ? LIMIT 1");
$parentStmt->bind_param('i', $intakeId);
$parentStmt->execute();
$parent = $parentStmt->get_result()->fetch_assoc() ?: [];
$parentStmt->close();

$requirementsStmt = $conn->prepare("SELECT * FROM {$intakeTable['requirements']} WHERE {$intakeTable['requirements_id']} = ? LIMIT 1");
$requirementsStmt->bind_param('i', $intakeId);
$requirementsStmt->execute();
$requirements = $requirementsStmt->get_result()->fetch_assoc() ?: [];
$requirementsStmt->close();

$enrollmentStmt = $conn->prepare('SELECT year_level, strand, room, level FROM enrolled_students WHERE lrn = ? LIMIT 1');
$enrollmentStmt->bind_param('s', $account['lrn']);
$enrollmentStmt->execute();
$enrollment = $enrollmentStmt->get_result()->fetch_assoc() ?: [];
$enrollmentStmt->close();

$savedDocuments = [];
foreach ($intakeTable['documents'] as $column => $documentInfo) {
    if (!empty($requirements[$column])) {
        $savedDocuments[] = [
            'category' => $documentInfo['category'],
            'label' => $documentInfo['label'],
            'url' => $requirements[$column],
        ];
    }
}
$requiredDocuments = [];
foreach ($intakeTable['documents'] as $column => $documentInfo) {
    $requiredDocuments[] = [
        'category' => $documentInfo['category'],
        'label' => $documentInfo['label'],
    ];
}

$photoPath = $requirements[$intakeTable['photo']] ?? null;
$photoStmt = $conn->prepare(
    'SELECT id FROM student_documents
     WHERE student_id = ? AND category = "id_photo"
     ORDER BY uploaded_at DESC, id DESC LIMIT 1'
);
$photoStmt->bind_param('i', $studentId);
$photoStmt->execute();
$uploadedPhoto = $photoStmt->get_result()->fetch_assoc();
$photoStmt->close();

echo json_encode([
    'success' => true,
    'profile' => [
        'student_id' => $studentId,
        'full_name' => $account['full_name'],
        'lrn' => $account['lrn'],
        'email' => $intake["email{$suffix}"] ?? $account['email_student'],
        'enrollment_type' => ucfirst($intakeType),
        'first_name' => $intake["fname{$suffix}"] ?? '',
        'middle_name' => $intake["mname{$suffix}"] ?? '',
        'last_name' => $intake["lname{$suffix}"] ?? '',
        'extension_name' => $intake["extname{$suffix}"] ?? '',
        'year_level' => $enrollment['year_level'] ?? $intake["yr_lvl{$suffix}"] ?? '',
        'strand' => $enrollment['strand'] ?? $intake["strand{$suffix}"] ?? '',
        'room' => $enrollment['room'] ?? '',
        'level' => $enrollment['level'] ?? '',
        'birthday' => $intake["bday{$suffix}"] ?? '',
        'age' => $intake["age{$suffix}"] ?? '',
        'gender' => $intake["gender{$suffix}"] ?? '',
        'phone' => $intake["phone{$suffix}"] ?? '',
        'primary_address' => $address["prim_add{$suffix}"] ?? '',
        'secondary_address' => $address["sec_add{$suffix}"] ?? '',
        'zip_code' => $address["zip_code{$suffix}"] ?? '',
        'parent_name' => $parent["parent_name{$suffix}"] ?? '',
        'parent_phone' => $parent["parent_phone{$suffix}"] ?? '',
        'parent_relationship' => $parent["parent_rel{$suffix}"] ?? '',
        'parent_address' => $parent["parent_add{$suffix}"] ?? '',
        'id_photo' => $photoPath,
        'id_photo_document_id' => $uploadedPhoto ? (int) $uploadedPhoto['id'] : null,
        'enrollment_documents' => $savedDocuments,
        'required_documents' => $requiredDocuments,
    ],
]);
