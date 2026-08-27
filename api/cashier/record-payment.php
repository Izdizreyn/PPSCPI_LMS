<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/fees_helper.php';

$user = requireRole(['purple_cashier']);

$input = json_decode(file_get_contents("php://input"), true);

$balanceCheck = $conn->prepare("SELECT student_id, student_type, student_lrn FROM student_balances WHERE balance_id = ?");
$balanceCheck->bind_param("i", $input['balance_id']);
$balanceCheck->execute();
$balanceRow = $balanceCheck->get_result()->fetch_assoc();
$balanceCheck->close();

if (!$balanceRow) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "Student balance not found."]);
    $conn->close();
    exit();
}

$studentLrn = trim((string) ($balanceRow['student_lrn'] ?? ''));
$queueCheck = $conn->prepare("SELECT queue_number FROM enrollment_schedule
    WHERE lrn = ? AND (status IS NULL OR status NOT IN ('Used', 'Settled'))
    ORDER BY enrollment_date DESC LIMIT 1");
$queueCheck->bind_param("s", $studentLrn);
$queueCheck->execute();
$activeQueue = $queueCheck->get_result()->fetch_assoc();
$queueCheck->close();

if (!$activeQueue) {
    http_response_code(409);
    echo json_encode(["success" => false, "message" => "This queue number has already been used. Request another queue number before making another payment."]);
    $conn->close();
    exit();
}

$payments = $input['payments'] ?? null;
$conn->begin_transaction();

if (is_array($payments) && count($payments) > 0) {
    $success = recordStudentPayments(
        $conn,
        $input['balance_id'],
        $payments,
        $input['payment_method'],
        $input['receipt_number'],
        $user['user_id'],
        $input['remarks']
    );

    if (!$success) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to record payment."]);
        $conn->close();
        exit();
    }

} else {
    $success = recordStudentPayment(
        $conn,
        $input['balance_id'],
        $input['amount'],
        $input['payment_method'],
        $input['receipt_number'],
        $user['user_id'],
        $input['remarks'],
        $input['fee_id'] ?? null
    );
}

if ($success) {
    if ($balanceRow) {
        $update = $conn->prepare("UPDATE enrollment_schedule
            SET status = 'Used'
            WHERE lrn = ? AND (status IS NULL OR status NOT IN ('Used', 'Settled'))
            ORDER BY enrollment_date DESC LIMIT 1");
        $update->bind_param("s", $studentLrn);
        $statusUpdated = $update->execute();
        $queueRowsUpdated = $statusUpdated && $update->affected_rows > 0;
        $update->close();

        if (!$queueRowsUpdated) {
            $update = $conn->prepare("UPDATE enrollment_schedule
                SET status = 'Settled'
                WHERE lrn = ? AND (status IS NULL OR status NOT IN ('Used', 'Settled'))
                ORDER BY enrollment_date DESC LIMIT 1");
            $update->bind_param("s", $studentLrn);
            $statusUpdated = $update->execute();
            $queueRowsUpdated = $statusUpdated && $update->affected_rows > 0;
            $update->close();
        }

        if (!$queueRowsUpdated) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Payment was recorded, but the queue status could not be updated."]);
            $conn->close();
            exit();
        }
    }

    $conn->commit();
    echo json_encode(["success" => true, "message" => "Payment recorded successfully."]);
} else {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to record payment."]);
}

$conn->close();