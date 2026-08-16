<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/fees_helper.php';

$user = requireRole(['purple_cashier']);

$input = json_decode(file_get_contents("php://input"), true);

$success = recordStudentPayment(
    $conn,
    $input['balance_id'],
    $input['amount'],
    $input['payment_method'],
    $input['receipt_number'],
    $user['user_id'], // cashier_id comes from the JWT, not a hidden form field
    $input['remarks'],
    $input['fee_id'] ?? null
);

if ($success) {
    echo json_encode(["success" => true, "message" => "Payment recorded successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to record payment."]);
}

if (recordStudentPayment($conn, $balance_id, $amount, $payment_method, $receipt_number, $cashier_id, $remarks, $fee_id)) {
    // Check if this payment brought the balance to zero — if so, mark the
    // matching enrollment_schedule record as Settled.
    $balanceCheck = $conn->prepare("SELECT student_id, student_type, remaining_balance FROM student_balances WHERE balance_id = ?");
    $balanceCheck->bind_param("i", $balance_id);
    $balanceCheck->execute();
    $balanceRow = $balanceCheck->get_result()->fetch_assoc();
    $balanceCheck->close();

    if ($balanceRow && (float) $balanceRow['remaining_balance'] <= 0) {
        $update = $conn->prepare("UPDATE enrollment_schedule SET status = 'Settled' WHERE student_type = ? AND student_id = ?");
        $update->bind_param("si", $balanceRow['student_type'], $balanceRow['student_id']);
        $update->execute();
        $update->close();
    }

    echo json_encode(["success" => true, "message" => "Payment recorded successfully."]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to record payment."]);
}

$conn->close();