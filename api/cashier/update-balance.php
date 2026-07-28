<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/fees_helper.php';

requireRole(['purple_cashier']);

$input = json_decode(file_get_contents("php://input"), true);
$balanceId = updateStudentBalanceRecord(
    $conn,
    $input['student_id'],
    $input['student_type'],
    $input['year_level'],
    $input['strand'] ?? null,
    $input['student_lrn'] ?? null
);

if ($balanceId) {
    echo json_encode(["success" => true, "message" => "Fees updated.", "balance_id" => $balanceId]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to update fees."]);
}

$conn->close();