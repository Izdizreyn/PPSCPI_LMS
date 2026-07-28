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

$today = date("Ymd");
$sql_queue = "SELECT MAX(queue_number) as max_queue FROM enrollment_schedule WHERE queue_number LIKE ?";
$likeParam = "$today%";
$stmt = $conn->prepare($sql_queue);
$stmt->bind_param("s", $likeParam);
$stmt->execute();
$row_queue = $stmt->get_result()->fetch_assoc();
$stmt->close();

$sequence = 1;
if ($row_queue['max_queue']) {
    $parts = explode('-', $row_queue['max_queue']);
    if (isset($parts[1])) $sequence = intval($parts[1]) + 1;
}
$queue_number = $today . '-' . str_pad($sequence, 3, '0', STR_PAD_LEFT);

$enrollee_name = $student["fname$prefix"] . ' ' . $student["mname$prefix"] . ' ' . $student["lname$prefix"];
if (!empty($student["extname$prefix"])) $enrollee_name .= ' ' . $student["extname$prefix"];
$lrn = $student["lrn$prefix"];

$conn->begin_transaction();
try {
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
    ]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error approving student: " . $e->getMessage()]);
}

$conn->close();