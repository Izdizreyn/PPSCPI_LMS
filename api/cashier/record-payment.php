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

$conn->close();