<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

requireRole(['purple_cashier']);

$sql = "SELECT
            payments.transaction_id,
            payments.payment_date,
            payments.amount,
            payments.payment_method,
            payments.receipt_number,
            payments.remarks,
            balances.student_lrn AS lrn,
            balances.remaining_balance,
            balances.total_fees,
            student.full_name
        FROM payment_transactions AS payments
        INNER JOIN student_balances AS balances ON balances.balance_id = payments.balance_id
        LEFT JOIN (
            SELECT lrn_new AS lrn,
                   TRIM(CONCAT(fname_new, ' ', mname_new, ' ', lname_new, ' ', COALESCE(extname_new, ''))) AS full_name
            FROM new_student_info
            UNION ALL
            SELECT lrn_old AS lrn,
                   TRIM(CONCAT(fname_old, ' ', mname_old, ' ', lname_old, ' ', COALESCE(extname_old, ''))) AS full_name
            FROM old_student_info
            UNION ALL
            SELECT lrn_trans AS lrn,
                   TRIM(CONCAT(fname_trans, ' ', mname_trans, ' ', lname_trans, ' ', COALESCE(extname_trans, ''))) AS full_name
            FROM transferee_info
        ) AS student ON student.lrn = balances.student_lrn
        ORDER BY payments.payment_date DESC";

$result = $conn->query($sql);
$records = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $records[] = $row;
    }
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to load payment records.']);
    $conn->close();
    exit();
}

echo json_encode(['success' => true, 'records' => $records]);
$conn->close();
