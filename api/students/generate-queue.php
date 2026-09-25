<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$user = requireRole(['purple_student']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$lrn = $user['lrn'] ?? null;
if (empty($lrn)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "No LRN found for this account."]);
    exit();
}

// One active queue per student at a time — block if one already exists
$activeCheck = $conn->prepare("SELECT queue_number FROM enrollment_schedule
    WHERE lrn = ? AND (status IS NULL OR status NOT IN ('Used', 'Settled'))
    ORDER BY enrollment_date DESC LIMIT 1");
$activeCheck->bind_param("s", $lrn);
$activeCheck->execute();
$active = $activeCheck->get_result()->fetch_assoc();
$activeCheck->close();

if ($active) {
    http_response_code(409);
    echo json_encode([
        "success" => false,
        "message" => "You already have an active queue number: " . $active['queue_number'],
    ]);
    exit();
}

// Confirm the student is Approved before letting them queue at all
$tables = [
    ['table' => 'new_student_info', 'lrn' => 'lrn_new', 'status' => 'status_new', 'type' => 'new', 'id' => 'id_new', 'fname' => 'fname_new', 'mname' => 'mname_new', 'lname' => 'lname_new', 'extname' => 'extname_new'],
    ['table' => 'old_student_info', 'lrn' => 'lrn_old', 'status' => 'status_old', 'type' => 'old', 'id' => 'id_old', 'fname' => 'fname_old', 'mname' => 'mname_old', 'lname' => 'lname_old', 'extname' => 'extname_old'],
    ['table' => 'transferee_info', 'lrn' => 'lrn_trans', 'status' => 'status_trans', 'type' => 'transferee', 'id' => 'id_trans', 'fname' => 'fname_trans', 'mname' => 'mname_trans', 'lname' => 'lname_trans', 'extname' => 'extname_trans'],
];

$studentRow = null;
$matched = null;

foreach ($tables as $t) {
    $stmt = $conn->prepare("SELECT * FROM {$t['table']} WHERE {$t['lrn']} = ?");
    $stmt->bind_param("s", $lrn);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $studentRow = $result->fetch_assoc();
        $matched = $t;
        $stmt->close();
        break;
    }
    $stmt->close();
}

if (!$studentRow) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Student record not found."]);
    exit();
}

if ($studentRow[$matched['status']] !== 'Approved') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Your enrollment must be approved before you can request a queue number."]);
    exit();
}

$enrolleeName = trim($studentRow[$matched['fname']] . ' ' . $studentRow[$matched['mname']] . ' ' . $studentRow[$matched['lname']] . ' ' . $studentRow[$matched['extname']]);
$studentId = $studentRow[$matched['id']];
$studentType = $matched['type'];

// Generate next sequential queue number for today
$today = date("Ymd");
$likeParam = "$today%";
$seqStmt = $conn->prepare("SELECT MAX(queue_number) as max_queue FROM enrollment_schedule WHERE queue_number LIKE ?");
$seqStmt->bind_param("s", $likeParam);
$seqStmt->execute();
$row = $seqStmt->get_result()->fetch_assoc();
$seqStmt->close();

$sequence = 1;
if ($row['max_queue']) {
    $parts = explode('-', $row['max_queue']);
    if (isset($parts[1])) $sequence = intval($parts[1]) + 1;
}
$queueNumber = $today . '-' . str_pad($sequence, 3, '0', STR_PAD_LEFT);

$insert = $conn->prepare("INSERT INTO enrollment_schedule (queue_number, enrollment_date, enrollee_name, lrn, student_type, student_id, status)
    VALUES (?, NOW(), ?, ?, ?, ?, 'Active')");
$insert->bind_param("ssssi", $queueNumber, $enrolleeName, $lrn, $studentType, $studentId);

if (!$insert->execute()) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to create queue: " . $insert->error]);
    $insert->close();
    $conn->close();
    exit();
}

$newQueueId = $conn->insert_id;
$insert->close();

// Fetch the freshly created row so the frontend gets the full object
$fetch = $conn->prepare("SELECT id_sched, queue_number, enrollment_date, enrollee_name, lrn, student_type, student_id, status
    FROM enrollment_schedule WHERE id_sched = ? LIMIT 1");
$fetch->bind_param("i", $newQueueId);
$fetch->execute();
$queue = $fetch->get_result()->fetch_assoc();
$fetch->close();

$conn->close();

echo json_encode([
    "success" => true,
    "message" => "Queue number generated successfully.",
    "queue_number" => $queueNumber,
    "queue" => $queue,      // ← full object the frontend can drop straight into setQueueInfo(...)
]);