<?php

define('MAX_FEE_TOTAL', 9000.00);

function getSchoolLevel($year_level)
{
    return in_array((string) $year_level, ['11', '12'], true) ? 'senior' : 'nursery-junior';
}

function calculateFees($conn, $year_level, $strand = null)
{
    $school_level = getSchoolLevel($year_level);

    $sql = "SELECT fc.category_id, fc.category_name, fc.description, fi.fee_id, fi.fee_name, fi.amount
            FROM fee_categories fc
            INNER JOIN fee_items fi ON fc.category_id = fi.category_id
            WHERE fc.school_level = ?
            ORDER BY fc.category_id ASC, fi.fee_id ASC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $school_level);
    $stmt->execute();
    $result = $stmt->get_result();

    $categories = [];
    $fees = [];
    $raw_total = 0;

    while ($row = $result->fetch_assoc()) {
        $category_name = $row['category_name'];
        $amount = (float) $row['amount'];

        if (!isset($categories[$category_name])) {
            $categories[$category_name] = [
                'category_name' => $category_name,
                'description' => $row['description'],
                'items' => [],
                'subtotal' => 0,
            ];
        }

        $categories[$category_name]['items'][] = $row;
        $categories[$category_name]['subtotal'] += $amount;
        $fees[] = $row;
        $raw_total += $amount;
    }

    $stmt->close();

    $total = $raw_total;
    $scale = 1;

    if ($raw_total > MAX_FEE_TOTAL && $raw_total > 0) {
        $scale = MAX_FEE_TOTAL / $raw_total;
        $total = MAX_FEE_TOTAL;

        foreach ($categories as &$category) {
            $category['subtotal'] = 0;
            foreach ($category['items'] as &$item) {
                $item['amount'] = round((float) $item['amount'] * $scale, 2);
                $category['subtotal'] += $item['amount'];
            }
            unset($item);
            $category['subtotal'] = round($category['subtotal'], 2);
        }
        unset($category);

        foreach ($fees as &$fee) {
            $fee['amount'] = round((float) $fee['amount'] * $scale, 2);
        }
        unset($fee);
    }

    return [
        'categories' => array_values($categories),
        'fees' => $fees,
        'total' => round($total, 2),
        'school_level' => $school_level,
        'max_fee_total' => MAX_FEE_TOTAL,
    ];
}

function recalculateBalance($conn, $balance_id)
{
    $balance_stmt = $conn->prepare('SELECT total_fees FROM student_balances WHERE balance_id = ?');
    $balance_stmt->bind_param('i', $balance_id);
    $balance_stmt->execute();
    $balance_result = $balance_stmt->get_result();

    if ($balance_result->num_rows === 0) {
        $balance_stmt->close();
        return false;
    }

    $total_fees = (float) $balance_result->fetch_assoc()['total_fees'];
    $balance_stmt->close();

    $payment_stmt = $conn->prepare('SELECT COALESCE(SUM(amount), 0) AS paid_total FROM payment_transactions WHERE balance_id = ?');
    $payment_stmt->bind_param('i', $balance_id);
    $payment_stmt->execute();
    $paid_amount = (float) $payment_stmt->get_result()->fetch_assoc()['paid_total'];
    $payment_stmt->close();

    $remaining_balance = $total_fees - $paid_amount;

    $update_stmt = $conn->prepare('UPDATE student_balances SET paid_amount = ?, remaining_balance = ?, last_updated = NOW() WHERE balance_id = ?');
    $update_stmt->bind_param('ddi', $paid_amount, $remaining_balance, $balance_id);
    $updated = $update_stmt->execute();
    $update_stmt->close();

    return $updated;
}

function renderFeeBreakdownHtml($fee_breakdown, $title = 'Fee Breakdown')
{
    if (!$fee_breakdown || empty($fee_breakdown['categories'])) {
        return '<div class="no-fees"><p>No fee information available.</p></div>';
    }

    $html = '<div class="fee-breakdown">';
    $html .= '<h3>' . htmlspecialchars($title) . '</h3>';
    $html .= '<table class="fee-table">';
    $html .= '<thead><tr><th>Category</th><th>Fee Item</th><th align="right">Amount</th></tr></thead>';
    $html .= '<tbody>';

    foreach ($fee_breakdown['categories'] as $category) {
        $item_count = count($category['items']);

        foreach ($category['items'] as $index => $item) {
            $html .= '<tr>';
            if ($index === 0) {
                $rowspan = $item_count > 1 ? ' rowspan="' . $item_count . '"' : '';
                $html .= '<td' . $rowspan . '><strong>' . htmlspecialchars($category['category_name']) . '</strong></td>';
            }
            $html .= '<td>' . htmlspecialchars($item['fee_name']) . '</td>';
            $html .= '<td align="right">₱ ' . number_format((float) $item['amount'], 2) . '</td>';
            $html .= '</tr>';
        }

        $html .= '<tr class="category-subtotal">';
        $html .= '<td colspan="2"><em>' . htmlspecialchars($category['category_name']) . ' Subtotal</em></td>';
        $html .= '<td align="right"><em>₱ ' . number_format((float) $category['subtotal'], 2) . '</em></td>';
        $html .= '</tr>';
    }

    $html .= '<tr class="total-row">';
    $html .= '<td colspan="2"><strong>Total Fees (Max ₱ ' . number_format(MAX_FEE_TOTAL, 2) . ')</strong></td>';
    $html .= '<td align="right"><strong>₱ ' . number_format((float) $fee_breakdown['total'], 2) . '</strong></td>';
    $html .= '</tr>';
    $html .= '</tbody></table>';
    $html .= '</div>';

    return $html;
}

function renderStatementSummaryHtml($balance)
{
    $html = '<div class="balance-summary">';
    $html .= '<table width="100%">';
    $html .= '<tr><td><strong>Total Fees:</strong></td><td align="right">₱ ' . number_format((float) $balance['total_fees'], 2) . '</td></tr>';
    $html .= '<tr><td><strong>Paid Amount:</strong></td><td align="right">₱ ' . number_format((float) $balance['paid_amount'], 2) . '</td></tr>';
    $html .= '<tr class="balance-highlight"><td><strong>Remaining Balance:</strong></td><td align="right">₱ ' . number_format((float) $balance['remaining_balance'], 2) . '</td></tr>';
    $html .= '<tr><td><strong>Last Updated:</strong></td><td align="right">' . date('F d, Y', strtotime($balance['last_updated'])) . '</td></tr>';
    $html .= '</table>';
    $html .= '</div>';

    return $html;
}

function renderPaymentHistoryHtml($conn, $balance_id, $editable = false)
{
    $stmt = $conn->prepare('SELECT * FROM payment_transactions WHERE balance_id = ? ORDER BY payment_date DESC');
    $stmt->bind_param('i', $balance_id);
    $stmt->execute();
    $payment_history = $stmt->get_result();
    $stmt->close();

    if (!$payment_history || $payment_history->num_rows === 0) {
        return '<div class="no-transactions"><p>No payment transactions found for this student.</p></div>';
    }

    $html = '<div class="transaction-history">';
    $html .= '<h3>Payment History</h3>';
    $html .= '<table class="transaction-table">';
    $html .= '<thead><tr>';
    $html .= '<th>Date</th><th>Amount</th><th>Method</th><th>Receipt #</th><th>Remarks</th>';

    if ($editable) {
        $html .= '<th>Actions</th>';
    }

    $html .= '</tr></thead><tbody>';

    while ($payment = $payment_history->fetch_assoc()) {
        $html .= '<tr>';
        $html .= '<td>' . date('M d, Y h:i A', strtotime($payment['payment_date'])) . '</td>';
        $html .= '<td>₱ ' . number_format((float) $payment['amount'], 2) . '</td>';
        $html .= '<td>' . htmlspecialchars($payment['payment_method']) . '</td>';
        $html .= '<td>' . htmlspecialchars($payment['receipt_number']) . '</td>';
        $html .= '<td>' . htmlspecialchars($payment['remarks']) . '</td>';

        if ($editable) {
            $html .= '<td>';
            $html .= '<button type="button" class="btn btn-sm btn-outline-primary edit-payment-btn" ';
            $html .= 'data-transaction-id="' . (int) $payment['transaction_id'] . '" ';
            $html .= 'data-amount="' . htmlspecialchars((string) $payment['amount'], ENT_QUOTES) . '" ';
            $html .= 'data-method="' . htmlspecialchars($payment['payment_method'], ENT_QUOTES) . '" ';
            $html .= 'data-receipt="' . htmlspecialchars((string) $payment['receipt_number'], ENT_QUOTES) . '" ';
            $html .= 'data-remarks="' . htmlspecialchars((string) $payment['remarks'], ENT_QUOTES) . '">Edit</button> ';
            $html .= '<form method="POST" style="display:inline;" onsubmit="return confirm(\'Delete this payment record?\');">';
            $html .= '<input type="hidden" name="delete_payment" value="1">';
            $html .= '<input type="hidden" name="transaction_id" value="' . (int) $payment['transaction_id'] . '">';
            $html .= '<input type="hidden" name="balance_id" value="' . (int) $balance_id . '">';
            $html .= '<button type="submit" class="btn btn-sm btn-outline-danger">Delete</button>';
            $html .= '</form>';
            $html .= '</td>';
        }

        $html .= '</tr>';
    }

    $html .= '</tbody></table></div>';

    return $html;
}

function ensurePaymentFeeColumn($conn)
{
    $result = $conn->query("SHOW COLUMNS FROM payment_transactions LIKE 'fee_id'");
    if ($result && $result->num_rows === 0) {
        $conn->query("ALTER TABLE payment_transactions ADD COLUMN fee_id INT(11) DEFAULT NULL AFTER balance_id");
    }
}

function getFeePaymentsByBalance($conn, $balance_id)
{
    ensurePaymentFeeColumn($conn);

    $payments = [];
    $stmt = $conn->prepare('SELECT fee_id, COALESCE(SUM(amount), 0) AS paid_total
                            FROM payment_transactions
                            WHERE balance_id = ? AND fee_id IS NOT NULL
                            GROUP BY fee_id');
    $stmt->bind_param('i', $balance_id);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $payments[(int) $row['fee_id']] = (float) $row['paid_total'];
    }

    $stmt->close();

    return $payments;
}

function buildFeePaymentStatuses($conn, $balance_id, $fee_breakdown)
{
    $fee_payments = $balance_id ? getFeePaymentsByBalance($conn, $balance_id) : [];
    $statuses = [];

    if (!$fee_breakdown || empty($fee_breakdown['fees'])) {
        return $statuses;
    }

    foreach ($fee_breakdown['fees'] as $fee) {
        $fee_id = (int) $fee['fee_id'];
        $amount_due = (float) $fee['amount'];
        $amount_paid = $fee_payments[$fee_id] ?? 0.0;
        $remaining = max(0, round($amount_due - $amount_paid, 2));
        $is_paid = $remaining <= 0.009;

        $statuses[] = [
            'fee_id' => $fee_id,
            'category_name' => $fee['category_name'],
            'fee_name' => $fee['fee_name'],
            'amount_due' => $amount_due,
            'amount_paid' => $amount_paid,
            'remaining' => $remaining,
            'is_paid' => $is_paid,
        ];
    }

    return $statuses;
}

function updateStudentBalanceRecord($conn, $student_id, $student_type, $year_level, $strand = null, $student_lrn = null)
{
    $fee_data = calculateFees($conn, $year_level, $strand);
    $total_fees = $fee_data['total'];
    $school_level = getSchoolLevel($year_level);
    $current_year = date('Y') . '-' . (date('Y') + 1);

    $stmt = $conn->prepare('SELECT * FROM student_balances WHERE student_id = ? AND student_type = ? AND academic_year = ?');
    $stmt->bind_param('iss', $student_id, $student_type, $current_year);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $balance = $result->fetch_assoc();
        $balance_id = (int) $balance['balance_id'];
        $paid_amount = (float) $balance['paid_amount'];
        $remaining_balance = $total_fees - $paid_amount;
        $stmt->close();

        $update_stmt = $conn->prepare('UPDATE student_balances
                                      SET total_fees = ?, remaining_balance = ?, year_level = ?, strand = ?,
                                          school_level = ?, student_lrn = ?, last_updated = NOW()
                                      WHERE balance_id = ?');
        $update_stmt->bind_param('ddssssi', $total_fees, $remaining_balance, $year_level, $strand, $school_level, $student_lrn, $balance_id);
        $update_stmt->execute();
        $update_stmt->close();

        return $balance_id;
    }

    $stmt->close();

    $insert_stmt = $conn->prepare('INSERT INTO student_balances
        (student_id, student_lrn, student_type, academic_year, school_level, year_level, strand, total_fees, remaining_balance)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $insert_stmt->bind_param('issssssdd', $student_id, $student_lrn, $student_type, $current_year, $school_level, $year_level, $strand, $total_fees, $total_fees);
    $insert_stmt->execute();
    $balance_id = (int) $conn->insert_id;
    $insert_stmt->close();

    return $balance_id;
}

function recordStudentPayment($conn, $balance_id, $amount, $payment_method, $receipt_number, $cashier_id, $remarks, $fee_id = null)
{
    ensurePaymentFeeColumn($conn);

    if ($fee_id !== null && $fee_id !== '') {
        $fee_id = (int) $fee_id;
    } else {
        $fee_id = null;
    }

    if ($fee_id !== null) {
        $stmt = $conn->prepare('INSERT INTO payment_transactions
            (balance_id, fee_id, amount, payment_method, receipt_number, cashier_id, remarks)
            VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('iidssis', $balance_id, $fee_id, $amount, $payment_method, $receipt_number, $cashier_id, $remarks);
    } else {
        $stmt = $conn->prepare('INSERT INTO payment_transactions
            (balance_id, amount, payment_method, receipt_number, cashier_id, remarks)
            VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->bind_param('idssis', $balance_id, $amount, $payment_method, $receipt_number, $cashier_id, $remarks);
    }

    if (!$stmt->execute()) {
        $stmt->close();
        return false;
    }

    $stmt->close();

    return recalculateBalance($conn, $balance_id);
}

function getStudentBalancesMap($conn, $academic_year = null)
{
    if ($academic_year === null) {
        $academic_year = date('Y') . '-' . (date('Y') + 1);
    }

    $map = [];
    $stmt = $conn->prepare('SELECT student_lrn, remaining_balance, total_fees, paid_amount
                            FROM student_balances
                            WHERE academic_year = ?');
    $stmt->bind_param('s', $academic_year);
    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
        $map[$row['student_lrn']] = $row;
    }

    $stmt->close();

    return $map;
}

function formatRemainingBalanceCell($lrn, $balances_map)
{
    if (!isset($balances_map[$lrn])) {
        return '<span class="balance-none">Not set</span>';
    }

    $remaining = (float) $balances_map[$lrn]['remaining_balance'];
    $class = $remaining <= 0 ? 'balance-paid' : 'balance-due';

    return '<span class="' . $class . '">₱ ' . number_format($remaining, 2) . '</span>';
}

function renderCashierFeeBreakdownHtml($fee_statuses)
{
    if (empty($fee_statuses)) {
        return '<p class="text-muted mb-0">No fee information available.</p>';
    }

    $html = '';

    foreach ($fee_statuses as $fee) {
        $fee_name = htmlspecialchars($fee['fee_name']);
        $category_name = htmlspecialchars($fee['category_name']);
        $amount_due = number_format((float) $fee['amount_due'], 2);
        $fee_id = (int) $fee['fee_id'];

        if ($fee['is_paid']) {
            $html .= '<div class="fee-item paid" title="Already paid">';
            $html .= '<span>' . $fee_name . ' <small class="text-muted">(' . $category_name . ')</small></span>';
            $html .= '<span class="fee-status paid-label">Paid · ₱ ' . $amount_due . '</span>';
            $html .= '</div>';
            continue;
        }

        $remaining = number_format((float) $fee['remaining'], 2, '.', '');
        $fee_name_js = htmlspecialchars($fee['fee_name'], ENT_QUOTES);
        $html .= '<button type="button" class="fee-item clickable" ';
        $html .= 'onclick="selectFeePayment(this, ' . $fee_id . ', \'' . $fee_name_js . '\', ' . $remaining . ')" ';
        $html .= 'title="Click to pay this fee">';
        $html .= '<span>' . $fee_name . ' <small class="text-muted">(' . $category_name . ')</small></span>';
        $html .= '<span class="fee-status unpaid-label">Pay ₱ ' . number_format((float) $fee['remaining'], 2) . '</span>';
        $html .= '</button>';
    }

    return $html;
}
