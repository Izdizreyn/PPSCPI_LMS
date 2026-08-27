<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

$studentType = $_GET['type'] ?? '';
$studentId = $_GET['id'] ?? '';

if (empty($studentType) || empty($studentId)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "type and id are required."]);
    exit();
}

$stmt = $conn->prepare("SELECT * FROM enrollment_schedule WHERE student_type = ? AND student_id = ? ORDER BY enrollment_date DESC");
$stmt->bind_param("si", $studentType, $studentId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "No queue information found for this student."]);
    exit();
}

$queueHistory = [];
while ($row = $result->fetch_assoc()) {
    $queueHistory[] = $row;
}
$queue = $queueHistory[0];
$stmt->close();

// Also pull strand/year level for display — original queue.php needed this
$tableMap = ['new' => ['new_student_info', 'id_new', '_new'], 'old' => ['old_student_info', 'id_old', '_old'], 'transferee' => ['transferee_info', 'id_trans', '_trans']];
$strand = 'N/A';
$yearLevel = 'N/A';

if (isset($tableMap[$studentType])) {
    [$table, $idCol, $suffix] = $tableMap[$studentType];
    $stmt = $conn->prepare("SELECT strand$suffix as strand, yr_lvl$suffix as yr_lvl FROM $table WHERE $idCol = ?");
    $stmt->bind_param("i", $studentId);
    $stmt->execute();
    $studentResult = $stmt->get_result();
    if ($studentResult->num_rows > 0) {
        $studentRow = $studentResult->fetch_assoc();
        $strand = $studentRow['strand'] ?: 'N/A';
        $yearLevel = $studentRow['yr_lvl'] ?: 'N/A';
    }
    $stmt->close();
}

$queue['strand'] = $strand;
$queue['year_level'] = $yearLevel;
$queue['queue_history'] = $queueHistory;

echo json_encode(["success" => true, "queue" => $queue]);
$conn->close();