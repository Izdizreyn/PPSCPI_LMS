<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

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

if ($balanceResult->num_rows === 0) {
    echo json_encode(["success" => true, "balance" => null, "transactions" => []]);
    exit();
}

$balance = $balanceResult->fetch_assoc();
$stmt->close();

// NOTE: fixed table name from "payment_transaction" (singular, original bug) to
// "payment_transactions" (plural, actual schema) — see PROGRESS.md known issues.
$stmt = $conn->prepare("SELECT * FROM payment_transactions WHERE balance_id = ? ORDER BY payment_date DESC");
$stmt->bind_param("i", $balance['balance_id']);
$stmt->execute();
$txResult = $stmt->get_result();
$transactions = [];
while ($row = $txResult->fetch_assoc()) {
    $transactions[] = $row;
}
$stmt->close();

echo json_encode(["success" => true, "balance" => $balance, "transactions" => $transactions]);
$conn->close();