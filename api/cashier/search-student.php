<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/fees_helper.php';

requireRole(['purple_cashier']);

$lrn = $_GET['lrn'] ?? '';
if (empty($lrn)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "LRN is required."]);
    exit();
}

function determineStudentType($conn, $lrn) {
    $tables = [
        ['table' => 'new_student_info', 'lrn_field' => 'lrn_new', 'type' => 'new'],
        ['table' => 'old_student_info', 'lrn_field' => 'lrn_old', 'type' => 'old'],
        ['table' => 'transferee_info', 'lrn_field' => 'lrn_trans', 'type' => 'transferee'],
    ];
    foreach ($tables as $t) {
        $stmt = $conn->prepare("SELECT * FROM {$t['table']} WHERE {$t['lrn_field']} = ?");
        $stmt->bind_param("s", $lrn);
        $stmt->execute();
        if ($stmt->get_result()->num_rows > 0) {
            $stmt->close();
            return $t['type'];
        }
        $stmt->close();
    }
    return null;
}

$type = determineStudentType($conn, $lrn);
if (!$type) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Student not found in any database."]);
    exit();
}

$fieldMap = [
    'new' => ['id' => 'id_new', 'lname' => 'lname_new', 'fname' => 'fname_new', 'mname' => 'mname_new', 'extname' => 'extname_new', 'yr' => 'yr_lvl_new', 'strand' => 'strand_new'],
    'old' => ['id' => 'id_old', 'lname' => 'lname_old', 'fname' => 'fname_old', 'mname' => 'mname_old', 'extname' => 'extname_old', 'yr' => 'yr_lvl_old', 'strand' => 'strand_old'],
    'transferee' => ['id' => 'id_trans', 'lname' => 'lname_trans', 'fname' => 'fname_trans', 'mname' => 'mname_trans', 'extname' => 'extname_trans', 'yr' => 'yr_lvl_trans', 'strand' => 'strand_trans'],
];
$tableName = $type === 'new' ? 'new_student_info' : ($type === 'old' ? 'old_student_info' : 'transferee_info');
$lrnField = $type === 'new' ? 'lrn_new' : ($type === 'old' ? 'lrn_old' : 'lrn_trans');
$f = $fieldMap[$type];

$stmt = $conn->prepare("SELECT * FROM $tableName WHERE $lrnField = ?");
$stmt->bind_param("s", $lrn);
$stmt->execute();
$student = $stmt->get_result()->fetch_assoc();
$stmt->close();

$fullName = $student[$f['lname']] . ', ' . $student[$f['fname']] . ' ' . $student[$f['mname']];
if (!empty($student[$f['extname']])) $fullName .= ' ' . $student[$f['extname']];

$studentId = $student[$f['id']];
$yearLevel = $student[$f['yr']];
$strand = $student[$f['strand']];
$currentYear = date('Y') . '-' . (date('Y') + 1);

$stmt = $conn->prepare("SELECT * FROM student_balances WHERE student_id = ? AND student_type = ? AND academic_year = ?");
$stmt->bind_param("iss", $studentId, $type, $currentYear);
$stmt->execute();
$balance = $stmt->get_result()->fetch_assoc();
$stmt->close();

$paymentHistory = [];
if ($balance) {
    $stmt = $conn->prepare("SELECT * FROM payment_transactions WHERE balance_id = ? ORDER BY payment_date DESC");
    $stmt->bind_param("i", $balance['balance_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) $paymentHistory[] = $row;
    $stmt->close();
}

$feeBreakdown = calculateFees($conn, $yearLevel, $strand);
$feeStatuses = buildFeePaymentStatuses($conn, $balance['balance_id'] ?? null, $feeBreakdown);

echo json_encode([
    "success" => true,
    "student" => [
        "id" => $studentId,
        "type" => $type,
        "lrn" => $lrn,
        "full_name" => $fullName,
        "year_level" => $yearLevel,
        "strand" => $strand,
    ],
    "balance" => $balance,
    "fee_breakdown" => $feeBreakdown,
    "fee_statuses" => $feeStatuses,
    "payment_history" => $paymentHistory,
]);

$conn->close();