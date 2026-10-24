<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$user = requireRole(['purple_student']);
$studentId = (int) ($user['user_id'] ?? 0);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?? [];
$fields = [
    'first_name' => 'First name',
    'middle_name' => 'Middle name',
    'last_name' => 'Last name',
    'extension_name' => 'Extension name',
    'birthday' => 'Birth date',
    'age' => 'Age',
    'gender' => 'Gender',
    'phone' => 'Phone number',
    'email' => 'Email',
    'primary_address' => 'Primary address',
    'secondary_address' => 'Secondary address',
    'zip_code' => 'Zip code',
    'parent_name' => 'Parent or guardian name',
    'parent_phone' => 'Parent or guardian phone',
    'parent_relationship' => 'Parent or guardian relationship',
    'parent_address' => 'Parent or guardian address',
];

$values = [];
foreach ($fields as $key => $label) {
    $value = trim((string) ($body[$key] ?? ''));
    if (strlen($value) > 255) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "$label is too long."]);
        exit;
    }
    $values[$key] = $value;
}

foreach (['first_name', 'last_name', 'birthday', 'age', 'gender', 'phone', 'email', 'primary_address'] as $required) {
    if ($values[$required] === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $fields[$required] . ' is required.']);
        exit;
    }
}

if (!filter_var($values['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Enter a valid email address.']);
    exit;
}
if (!preg_match('/^09\d{9}$/', $values['phone'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Enter a valid 11-digit mobile number starting with 09.']);
    exit;
}
if (!ctype_digit($values['age']) || (int) $values['age'] > 120) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Enter a valid age.']);
    exit;
}

$types = [
    'new' => ['info' => 'new_student_info', 'id' => 'id_new', 'lrn' => 'lrn_new', 'suffix' => '_new', 'address' => 'new_student_address', 'address_id' => 'id_add_new', 'parent' => 'new_student_parent', 'parent_id' => 'id_par_new'],
    'old' => ['info' => 'old_student_info', 'id' => 'id_old', 'lrn' => 'lrn_old', 'suffix' => '_old', 'address' => 'old_student_address', 'address_id' => 'id_old_add', 'parent' => 'old_student_parent', 'parent_id' => 'id_par_old'],
    'transferee' => ['info' => 'transferee_info', 'id' => 'id_trans', 'lrn' => 'lrn_trans', 'suffix' => '_trans', 'address' => 'transferee_address', 'address_id' => 'id_add_trans', 'parent' => 'transferee_parent', 'parent_id' => 'id_par_trans'],
];

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

$intake = null;
$tables = null;
foreach ($types as $candidate) {
    $stmt = $conn->prepare("SELECT {$candidate['id']} FROM {$candidate['info']} WHERE {$candidate['lrn']} = ? LIMIT 1");
    $stmt->bind_param('s', $account['lrn']);
    $stmt->execute();
    $intake = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if ($intake) {
        $tables = $candidate;
        break;
    }
}

if (!$intake || !$tables) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Enrollment information was not found.']);
    exit;
}

$suffix = $tables['suffix'];
$intakeId = (int) $intake[$tables['id']];
$fullName = trim(implode(' ', array_filter([
    $values['first_name'],
    $values['middle_name'],
    $values['last_name'],
    $values['extension_name'],
], static fn($part) => $part !== '')));

try {
    $conn->begin_transaction();

    $emailStmt = $conn->prepare('UPDATE students SET email_student = ?, full_name = ? WHERE id_student = ?');
    $emailStmt->bind_param('ssi', $values['email'], $fullName, $studentId);
    $emailStmt->execute();
    $emailStmt->close();

    $infoStmt = $conn->prepare(
        "UPDATE {$tables['info']}
         SET fname{$suffix} = ?, mname{$suffix} = ?, lname{$suffix} = ?, extname{$suffix} = ?,
             bday{$suffix} = ?, age{$suffix} = ?, gender{$suffix} = ?, phone{$suffix} = ?, email{$suffix} = ?
         WHERE {$tables['id']} = ?"
    );
    $infoStmt->bind_param(
        'sssssssssi',
        $values['first_name'],
        $values['middle_name'],
        $values['last_name'],
        $values['extension_name'],
        $values['birthday'],
        $values['age'],
        $values['gender'],
        $values['phone'],
        $values['email'],
        $intakeId
    );
    $infoStmt->execute();
    $infoStmt->close();

    $addressStmt = $conn->prepare(
        "UPDATE {$tables['address']}
         SET prim_add{$suffix} = ?, sec_add{$suffix} = ?, zip_code{$suffix} = ?
         WHERE {$tables['address_id']} = ?"
    );
    $addressStmt->bind_param(
        'sssi',
        $values['primary_address'],
        $values['secondary_address'],
        $values['zip_code'],
        $intakeId
    );
    $addressStmt->execute();
    $addressStmt->close();

    $parentStmt = $conn->prepare(
        "UPDATE {$tables['parent']}
         SET parent_name{$suffix} = ?, parent_phone{$suffix} = ?,
             parent_rel{$suffix} = ?, parent_add{$suffix} = ?
         WHERE {$tables['parent_id']} = ?"
    );
    $parentStmt->bind_param(
        'ssssi',
        $values['parent_name'],
        $values['parent_phone'],
        $values['parent_relationship'],
        $values['parent_address'],
        $intakeId
    );
    $parentStmt->execute();
    $parentStmt->close();

    $activity = 'Updated profile information';
    $activityStmt = $conn->prepare('INSERT INTO student_activity (student_id, activity) VALUES (?, ?)');
    $activityStmt->bind_param('is', $studentId, $activity);
    $activityStmt->execute();
    $activityStmt->close();

    $conn->commit();
} catch (mysqli_sql_exception $exception) {
    $conn->rollback();
    if ($exception->getCode() === 1062) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'That email address is already in use.']);
        exit;
    }
    error_log('Unable to update student profile: ' . $exception->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Profile changes could not be saved.']);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Profile updated successfully.',
    'profile' => [
        'full_name' => $fullName,
        ...$values,
    ],
]);
