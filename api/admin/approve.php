<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/queue_helper.php';
require_once __DIR__ . '/../helpers/sms_helper.php';

requireRole(['purple_admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);
$type = $input['type'] ?? '';
$id = $input['id'] ?? '';

$tableMap = ['new' => 'new_student_info', 'old' => 'old_student_info', 'transferee' => 'transferee_info'];
$idColMap = ['new' => 'id_new', 'old' => 'id_old', 'transferee' => 'id_trans'];
$statusColMap = ['new' => 'status_new', 'old' => 'status_old', 'transferee' => 'status_trans'];
$prefixMap = ['new' => '_new', 'old' => '_old', 'transferee' => '_trans'];

if (!isset($tableMap[$type]) || empty($id)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Invalid type or id."]);
    exit();
}

$table = $tableMap[$type];
$idCol = $idColMap[$type];
$statusCol = $statusColMap[$type];
$prefix = $prefixMap[$type];

$stmt = $conn->prepare("SELECT * FROM $table WHERE $idCol = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();
$student = $result->fetch_assoc();
$stmt->close();

if (!$student) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Student not found."]);
    exit();
}

$lrn = $student["lrn$prefix"];
$email = trim($student["email$prefix"] ?? '');
$accountStmt = $conn->prepare("SELECT id_student FROM students WHERE lrn = ? LIMIT 1");
$accountStmt->bind_param("s", $lrn);
$accountStmt->execute();
$existingAccount = $accountStmt->get_result()->fetch_assoc();
$accountStmt->close();
$student_account_id = $existingAccount['id_student'] ?? null;

if ($student_account_id === null) {
    if ($email === '') {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "This applicant has no email address. Add a unique email address before approving enrollment.",
        ]);
        exit();
    }

    $emailStmt = $conn->prepare("SELECT lrn FROM students WHERE email_student = ? LIMIT 1");
    $emailStmt->bind_param("s", $email);
    $emailStmt->execute();
    $emailOwner = $emailStmt->get_result()->fetch_assoc();
    $emailStmt->close();

    if ($emailOwner && $emailOwner['lrn'] !== $lrn) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "This email address is already linked to another student account. Update the applicant's email address to a unique one before approving enrollment.",
        ]);
        exit();
    }
}

$conn->query("CREATE TABLE IF NOT EXISTS queue_batch_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_date DATE NOT NULL,
    queue_batch VARCHAR(20) NOT NULL,
    batch_start VARCHAR(20) NOT NULL,
    batch_end VARCHAR(20) NOT NULL,
    current_number INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");
$today = date('Y-m-d');
$todayKey = date('Ymd');
$batchResult = $conn->query("SELECT * FROM queue_batch_settings WHERE batch_date = CURDATE() ORDER BY id DESC LIMIT 1");
if (!$batchResult || $batchResult->num_rows === 0) {
    $batchStart = $todayKey . '-01';
    $batchEnd = $todayKey . '-50';
    $queueBatch = $batchStart;
    $insertBatch = $conn->prepare("INSERT INTO queue_batch_settings
        (batch_date, queue_batch, batch_start, batch_end, current_number)
        VALUES (?, ?, ?, ?, 1)");
    $insertBatch->bind_param('ssss', $today, $queueBatch, $batchStart, $batchEnd);
    $insertBatch->execute();
    $insertBatch->close();
} else {
    $batchRow = $batchResult->fetch_assoc();
    $batchStart = (string) $batchRow['batch_start'];
    $batchEnd = (string) $batchRow['batch_end'];
    $queueBatch = (string) $batchRow['queue_batch'];
    foreach (['batchStart', 'batchEnd', 'queueBatch'] as $batchValue) {
        $$batchValue = normalizeQueueBatchNumber($$batchValue);
    }
}

$startSequence = queueBatchSequence($batchStart);
$endSequence = queueBatchSequence($batchEnd);
$settingsSequence = queueBatchSequence($queueBatch);
$maxQueueStmt = $conn->prepare("SELECT queue_number FROM enrollment_schedule
    WHERE queue_number LIKE CONCAT(?, '%')
    ORDER BY CAST(SUBSTRING_INDEX(queue_number, '-', -1) AS UNSIGNED) DESC LIMIT 1");
$maxQueueStmt->bind_param('s', $todayKey);
$maxQueueStmt->execute();
$maxQueueRow = $maxQueueStmt->get_result()->fetch_assoc();
$maxQueueStmt->close();
$lastIssuedSequence = $maxQueueRow
    ? queueBatchSequence($maxQueueRow['queue_number'])
    : 0;
$queueSequence = max($startSequence, $settingsSequence, $lastIssuedSequence + ($lastIssuedSequence > 0 ? 1 : 0));

if ($queueSequence > $endSequence) {
    http_response_code(409);
    echo json_encode(["success" => false, "message" => "Today's queue batch is full. Update the batch range to continue."]);
    $conn->close();
    exit();
}

$queue_number = $todayKey . '-' . str_pad($queueSequence, 2, '0', STR_PAD_LEFT);
$nextSequence = min($queueSequence + 1, $endSequence);
$nextBatch = $todayKey . '-' . str_pad($nextSequence, 2, '0', STR_PAD_LEFT);
$updateBatchStmt = $conn->prepare("UPDATE queue_batch_settings
    SET queue_batch = ?, current_number = ?, batch_start = ?, batch_end = ?
    WHERE batch_date = CURDATE() ORDER BY id DESC LIMIT 1");
$updateBatchStmt->bind_param('siis', $nextBatch, $nextSequence, $batchStart, $batchEnd);
$updateBatchStmt->execute();
$updateBatchStmt->close();

$enrollee_name = $student["fname$prefix"] . ' ' . $student["mname$prefix"] . ' ' . $student["lname$prefix"];
if (!empty($student["extname$prefix"])) $enrollee_name .= ' ' . $student["extname$prefix"];
$default_password = 'ppscpi123';
$hashed_password = password_hash($default_password, PASSWORD_BCRYPT);

$conn->begin_transaction();
try {
    if ($student_account_id === null) {
        // Student account doesn't exist, create it
        $insertStmt = $conn->prepare("INSERT INTO students (email_student, password_student, lrn, full_name, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
        $role = 'purple_student';
        $insertStmt->bind_param("sssss", $email, $hashed_password, $lrn, $enrollee_name, $role);
        $insertStmt->execute();
        $student_account_id = $insertStmt->insert_id;
        $insertStmt->close();
    }

    $stmt = $conn->prepare("INSERT INTO enrollment_schedule (queue_number, enrollment_date, enrollee_name, lrn, student_type, student_id) VALUES (?, NOW(), ?, ?, ?, ?)");
    $stmt->bind_param("ssssi", $queue_number, $enrollee_name, $lrn, $type, $id);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("UPDATE $table SET $statusCol = 'Approved' WHERE $idCol = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();

    $conn->commit();

    $phone = $student["phone$prefix"] ?? '';
    $smsResult = null;
    if (!empty($phone)) {
        $smsResult = sendEnrollmentApprovedSms($phone, $enrollee_name, $queue_number);
    }

    echo json_encode([
        "success" => true,
        "message" => "Student enrollment approved successfully!",
        "queue_number" => $queue_number,
        "student_account_created" => true,
        "student_email" => $email,
        "default_password" => $default_password,
        "sms_sent" => $smsResult['success'] ?? false,
        "sms_message" => $smsResult['message'] ?? 'No phone number on file.',
    ]);
} catch (Exception $e) {
    $conn->rollback();
    if ((int) $e->getCode() === 1062) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "A student account with this email address or LRN already exists. Verify the applicant's details and try again.",
        ]);
        $conn->close();
        exit();
    }

    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error approving student: " . $e->getMessage()]);
}

$conn->close();