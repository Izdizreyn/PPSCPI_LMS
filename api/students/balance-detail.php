<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/fees_helper.php';

$lrn = $_GET['lrn'] ?? '';

if (empty($lrn)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "LRN is required."]);
    exit();
}

$stmt = $conn->prepare("SELECT * FROM student_balances WHERE student_lrn = ? ORDER BY last_updated DESC LIMIT 1");
$stmt->bind_param("s", $lrn);
$stmt->execute();
$balanceResult = $stmt->get_result();
$balance = $balanceResult->num_rows > 0 ? $balanceResult->fetch_assoc() : null;
$stmt->close();

$studentQuery = "SELECT * FROM (
    SELECT 'new' as type, id_new as student_id, lrn_new as lrn, yr_lvl_new as year_level, strand_new as strand
    FROM new_student_info
    UNION ALL
    SELECT 'old' as type, id_old as student_id, lrn_old as lrn, yr_lvl_old as year_level, strand_old as strand
    FROM old_student_info
    UNION ALL
    SELECT 'transferee' as type, id_trans as student_id, lrn_trans as lrn, yr_lvl_trans as year_level, strand_trans as strand
    FROM transferee_info
) AS students WHERE lrn = ?";
$stmt = $conn->prepare($studentQuery);
$stmt->bind_param("s", $lrn);
$stmt->execute();
$studentResult = $stmt->get_result();
$studentData = $studentResult->num_rows > 0 ? $studentResult->fetch_assoc() : null;
$stmt->close();

$feeBreakdown = $studentData ? calculateFees($conn, $studentData['year_level'], $studentData['strand']) : null;

$transactions = [];
if ($balance) {
    $stmt = $conn->prepare("SELECT * FROM payment_transactions WHERE balance_id = ? ORDER BY payment_date DESC");
    $stmt->bind_param("i", $balance['balance_id']);
    $stmt->execute();
    $txResult = $stmt->get_result();
    while ($row = $txResult->fetch_assoc()) {
        $transactions[] = $row;
    }
    $stmt->close();
}

echo json_encode([
    "success" => true,
    "balance" => $balance,
    "fee_breakdown" => $feeBreakdown,
    "transactions" => $transactions,
]);

$conn->close();