<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

$user = requireRole(['purple_student']);
$studentId = (int) ($user['user_id'] ?? 0);

$studentStmt = $conn->prepare('SELECT lrn FROM students WHERE id_student = ? LIMIT 1');
$studentStmt->bind_param('i', $studentId);
$studentStmt->execute();
$student = $studentStmt->get_result()->fetch_assoc();
$studentStmt->close();

if (!$student) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Student account not found.']);
    exit;
}

$balanceStmt = $conn->prepare(
    'SELECT balance_id, total_fees, paid_amount, remaining_balance, last_updated
     FROM student_balances
     WHERE student_lrn = ?
     ORDER BY last_updated DESC
     LIMIT 1'
);
$balanceStmt->bind_param('s', $student['lrn']);
$balanceStmt->execute();
$balance = $balanceStmt->get_result()->fetch_assoc();
$balanceStmt->close();

if (!$balance) {
    echo json_encode(['success' => true, 'balance' => null, 'transactions' => []]);
    exit;
}

$paymentStmt = $conn->prepare(
    'SELECT amount, payment_date
     FROM payment_transactions
     WHERE balance_id = ?
     ORDER BY payment_date DESC'
);
$paymentStmt->bind_param('i', $balance['balance_id']);
$paymentStmt->execute();
$transactions = $paymentStmt->get_result()->fetch_all(MYSQLI_ASSOC);
$paymentStmt->close();
unset($balance['balance_id']);

echo json_encode([
    'success' => true,
    'balance' => $balance,
    'transactions' => $transactions,
]);
