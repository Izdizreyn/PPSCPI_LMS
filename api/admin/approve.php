<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

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

$batchResult = $conn->query("SELECT * FROM queue_batch_settings WHERE batch_date = CURDATE() ORDER BY id DESC LIMIT 1");
$queueBatch = date('Ymd') . '-001';
$batchStart = date('Ymd') . '-001';
$batchEnd = date('Ymd') . '-100';

if ($batchResult && $batchResult->num_rows > 0) {
    $batchRow = $batchResult->fetch_assoc();
    if (!empty($batchRow['queue_batch'])) {
        $queueBatch = $batchRow['queue_batch'];
    }
    if (!empty($batchRow['batch_start'])) {
        $batchStart = $batchRow['batch_start'];
    }
    if (!empty($batchRow['batch_end'])) {
        $batchEnd = $batchRow['batch_end'];
    }
} else {
    $fallbackStmt = $conn->prepare("SELECT * FROM queue_batch_settings ORDER BY batch_date DESC, id DESC LIMIT 1");
    $fallbackStmt->execute();
    $fallbackRow = $fallbackStmt->get_result()->fetch_assoc();
    $fallbackStmt->close();

    if ($fallbackRow && !empty($fallbackRow['batch_start'])) {
        $batchStart = $fallbackRow['batch_start'];
        $batchEnd = $fallbackRow['batch_end'];
        $queueBatch = $batchStart;
    }
}

$queue_number = $queueBatch;

if (preg_match('/^(\d{8})-(\d{3})$/', $queueBatch, $matches)) {
    $currentSequence = intval($matches[2]);
    if ($currentSequence >= 100) {
        $queue_number = $matches[1] . '-100';
    }
}

if (preg_match('/^(\d{8})-(\d{3})$/', $queueBatch, $matches)) {
    $nextSequence = intval($matches[2]) + 1;
    if ($nextSequence > 100) {
        $nextSequence = 100;
    }
    $nextBatch = $matches[1] . '-' . str_pad($nextSequence, 3, '0', STR_PAD_LEFT);
} else {
    $nextBatch = $queueBatch;
}

$batchStmt = $conn->prepare("INSERT INTO queue_batch_history (batch_date, batch_start, batch_end, last_queue_number) VALUES (CURDATE(), ?, ?, ?)");
$batchStmt->bind_param('sss', $batchStart, $batchEnd, $queue_number);
$batchStmt->execute();
$batchStmt->close();

$updateBatchStmt = $conn->prepare("UPDATE queue_batch_settings SET queue_batch = ?, current_number = ?, batch_start = ?, batch_end = ? WHERE batch_date = CURDATE() ORDER BY id DESC LIMIT 1");
$nextNumber = (int) substr($nextBatch, -3);
$updateBatchStmt->bind_param('siis', $nextBatch, $nextNumber, $batchStart, $batchEnd);
$updateBatchStmt->execute();
$updateBatchStmt->close();

$enrollee_name = $student["fname$prefix"] . ' ' . $student["mname$prefix"] . ' ' . $student["lname$prefix"];
if (!empty($student["extname$prefix"])) $enrollee_name .= ' ' . $student["extname$prefix"];
$lrn = $student["lrn$prefix"];
$email = $student["email$prefix"];
$default_password = 'ppscpi123';
$hashed_password = password_hash($default_password, PASSWORD_BCRYPT);

$conn->begin_transaction();
try {
    // Create student account if it doesn't exist
    $checkStmt = $conn->prepare("SELECT id_student FROM students WHERE lrn = ?");
    $checkStmt->bind_param("s", $lrn);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    $student_account_id = null;
    
    if ($checkResult->num_rows === 0) {
        // Student account doesn't exist, create it
        $insertStmt = $conn->prepare("INSERT INTO students (email_student, password_student, lrn, full_name, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())");
        $role = 'purple_student';
        $insertStmt->bind_param("sssss", $email, $hashed_password, $lrn, $enrollee_name, $role);
        $insertStmt->execute();
        $student_account_id = $insertStmt->insert_id;
        $insertStmt->close();
    } else {
        $accountRow = $checkResult->fetch_assoc();
        $student_account_id = $accountRow['id_student'];
    }
    $checkStmt->close();

    $stmt = $conn->prepare("INSERT INTO enrollment_schedule (queue_number, enrollment_date, enrollee_name, lrn, student_type, student_id) VALUES (?, NOW(), ?, ?, ?, ?)");
    $stmt->bind_param("ssssi", $queue_number, $enrollee_name, $lrn, $type, $id);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare("UPDATE $table SET $statusCol = 'Approved' WHERE $idCol = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Student enrollment approved successfully!",
        "queue_number" => $queue_number,
        "student_account_created" => true,
        "student_email" => $email,
        "default_password" => $default_password
    ]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error approving student: " . $e->getMessage()]);
}

$conn->close();