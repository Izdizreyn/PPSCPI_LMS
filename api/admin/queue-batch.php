<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/queue_helper.php';

requireRole(['purple_admin']);

function ensureQueueBatchTables($conn)
{
    $conn->query("CREATE TABLE IF NOT EXISTS queue_batch_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_date DATE NOT NULL,
        queue_batch VARCHAR(20) NOT NULL,
        batch_start VARCHAR(20) NOT NULL,
        batch_end VARCHAR(20) NOT NULL,
        current_number INT NOT NULL DEFAULT 1,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");
    $conn->query("CREATE TABLE IF NOT EXISTS queue_batch_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_date DATE NOT NULL,
        batch_start VARCHAR(20) NOT NULL,
        batch_end VARCHAR(20) NOT NULL,
        last_queue_number VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $columns = [];
    $result = $conn->query("SHOW COLUMNS FROM queue_batch_settings");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $columns[] = $row['Field'];
        }
    }

    foreach (['batch_date', 'queue_batch', 'batch_start', 'batch_end', 'current_number'] as $column) {
        if (!in_array($column, $columns, true)) {
            $alterSql = [
                'batch_date' => "ALTER TABLE queue_batch_settings ADD COLUMN batch_date DATE NULL AFTER id",
                'queue_batch' => "ALTER TABLE queue_batch_settings ADD COLUMN queue_batch VARCHAR(20) NULL AFTER batch_date",
                'batch_start' => "ALTER TABLE queue_batch_settings ADD COLUMN batch_start VARCHAR(20) NULL AFTER queue_batch",
                'batch_end' => "ALTER TABLE queue_batch_settings ADD COLUMN batch_end VARCHAR(20) NULL AFTER batch_start",
                'current_number' => "ALTER TABLE queue_batch_settings ADD COLUMN current_number INT NOT NULL DEFAULT 1 AFTER batch_end",
            ][$column];
            $conn->query($alterSql);
        }
    }

    $conn->query("UPDATE queue_batch_settings
        SET batch_date = COALESCE(batch_date, CURDATE()),
            queue_batch = COALESCE(queue_batch, CONCAT(DATE_FORMAT(CURDATE(), '%Y%m%d'), '-01')),
            batch_start = COALESCE(batch_start, CONCAT(DATE_FORMAT(CURDATE(), '%Y%m%d'), '-01')),
            batch_end = COALESCE(batch_end, CONCAT(DATE_FORMAT(CURDATE(), '%Y%m%d'), '-50')),
            current_number = COALESCE(current_number, 1)
        WHERE batch_date IS NULL
           OR queue_batch IS NULL
           OR batch_start IS NULL
           OR batch_end IS NULL
           OR current_number IS NULL");

    $conn->query("CREATE TABLE IF NOT EXISTS queue_usage_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        queue_number VARCHAR(20) NOT NULL,
        lrn VARCHAR(50) NOT NULL,
        student_type VARCHAR(20) NOT NULL,
        student_id INT NOT NULL,
        balance_id INT DEFAULT NULL,
        amount DECIMAL(12,2) DEFAULT 0.00,
        recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) NOT NULL DEFAULT 'Used'
    )");
}

function parseQueueBatchRange($value)
{
    $trimmed = trim((string) $value);
    if ($trimmed === '') {
        return null;
    }

    if (preg_match('/^(\d{8})-(\d{2,3})\s+to\s+(\d{8})-(\d{2,3})$/i', $trimmed, $matches)) {
        $startDate = $matches[1];
        $startSeq = (int) $matches[2];
        $endDate = $matches[3];
        $endSeq = (int) $matches[4];

        if ($startDate !== $endDate || $startSeq < 1 || $endSeq > 99 || $startSeq > $endSeq) {
            return null;
        }

        return [
            'batch_date' => $startDate,
            'batch_start' => $startDate . '-' . str_pad($startSeq, 2, '0', STR_PAD_LEFT),
            'batch_end' => $endDate . '-' . str_pad($endSeq, 2, '0', STR_PAD_LEFT),
            'queue_batch' => $startDate . '-' . str_pad($startSeq, 2, '0', STR_PAD_LEFT),
        ];
    }

    if (preg_match('/^(\d{8})-(\d{2,3})$/', $trimmed, $matches)) {
        $batchDate = $matches[1];
        $sequence = (int) $matches[2];
        $endSequence = max(50, $sequence);
        if ($sequence < 1 || $endSequence > 99) {
            return null;
        }

        return [
            'batch_date' => $batchDate,
            'batch_start' => $batchDate . '-' . str_pad($sequence, 2, '0', STR_PAD_LEFT),
            'batch_end' => $batchDate . '-' . str_pad($endSequence, 2, '0', STR_PAD_LEFT),
            'queue_batch' => $batchDate . '-' . str_pad($sequence, 2, '0', STR_PAD_LEFT),
        ];
    }

    return null;
}

function saveYesterdayQueueBatchHistory($conn)
{
    $previousStmt = $conn->prepare("SELECT batch_date, batch_start, batch_end
        FROM queue_batch_settings
        WHERE batch_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        ORDER BY id DESC LIMIT 1");
    $previousStmt->execute();
    $previousBatch = $previousStmt->get_result()->fetch_assoc();
    $previousStmt->close();

    if (!$previousBatch) {
        return;
    }

    $historyCheck = $conn->prepare('SELECT id FROM queue_batch_history
        WHERE batch_date = ? ORDER BY id DESC LIMIT 1');
    $historyCheck->bind_param('s', $previousBatch['batch_date']);
    $historyCheck->execute();
    $historyRow = $historyCheck->get_result()->fetch_assoc();
    $historyCheck->close();

    $lastQueueStmt = $conn->prepare("SELECT queue_number FROM enrollment_schedule
        WHERE DATE(enrollment_date) = ?
        ORDER BY CAST(SUBSTRING_INDEX(queue_number, '-', -1) AS UNSIGNED) DESC LIMIT 1");
    $lastQueueStmt->bind_param('s', $previousBatch['batch_date']);
    $lastQueueStmt->execute();
    $lastQueue = $lastQueueStmt->get_result()->fetch_assoc();
    $lastQueueStmt->close();

    $previousBatch['batch_start'] = normalizeQueueBatchNumber($previousBatch['batch_start']);
    $previousBatch['batch_end'] = normalizeQueueBatchNumber($previousBatch['batch_end']);
    $lastQueueNumber = $lastQueue['queue_number'] ?? $previousBatch['batch_start'];
    if ($historyRow) {
        $historyStmt = $conn->prepare("UPDATE queue_batch_history
            SET batch_start = ?, batch_end = ?, last_queue_number = ? WHERE id = ?");
        $historyStmt->bind_param(
            'sssi',
            $previousBatch['batch_start'],
            $previousBatch['batch_end'],
            $lastQueueNumber,
            $historyRow['id']
        );
    } else {
        $historyStmt = $conn->prepare("INSERT INTO queue_batch_history
            (batch_date, batch_start, batch_end, last_queue_number) VALUES (?, ?, ?, ?)");
        $historyStmt->bind_param(
            'ssss',
            $previousBatch['batch_date'],
            $previousBatch['batch_start'],
            $previousBatch['batch_end'],
            $lastQueueNumber
        );
    }
    $historyStmt->execute();
    $historyStmt->close();
}

function getQueueBatchRow($conn)
{
    saveYesterdayQueueBatchHistory($conn);

    $batchDate = date('Y-m-d');
    $batchKey = date('Ymd');
    $stmt = $conn->prepare("SELECT * FROM queue_batch_settings WHERE batch_date = CURDATE() ORDER BY id DESC LIMIT 1");
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($row) {
        foreach (['queue_batch', 'batch_start', 'batch_end'] as $column) {
            $row[$column] = normalizeQueueBatchNumber($row[$column]);
        }
        return $row;
    }

    $defaultStart = $batchKey . '-01';
    $defaultEnd = $batchKey . '-50';
    $stmt = $conn->prepare("INSERT INTO queue_batch_settings (batch_date, queue_batch, batch_start, batch_end, current_number) VALUES (?, ?, ?, ?, 1)");
    $stmt->bind_param('ssss', $batchDate, $defaultStart, $defaultStart, $defaultEnd);
    $stmt->execute();
    $stmt->close();

    return [
        'batch_date' => $batchDate,
        'queue_batch' => $defaultStart,
        'batch_start' => $defaultStart,
        'batch_end' => $defaultEnd,
        'current_number' => 1,
    ];
}

function buildBatchRangeText($row)
{
    if (empty($row['batch_start']) || empty($row['batch_end'])) {
        return '';
    }

    return $row['batch_start'] . ' to ' . $row['batch_end'];
}

try {
    ensureQueueBatchTables($conn);

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $row = getQueueBatchRow($conn);
        $historySql = "SELECT batch_date, batch_start, batch_end, last_queue_number
            FROM queue_batch_history
            WHERE batch_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            ORDER BY batch_date DESC, id DESC
            LIMIT 1";
        $historyResult = $conn->query($historySql);
        $history = [];

        if ($historyResult) {
            while ($historyRow = $historyResult->fetch_assoc()) {
                $history[] = $historyRow;
            }
        }

        echo json_encode([
            'success' => true,
            'batch' => buildBatchRangeText($row),
            'queue_batch' => buildBatchRangeText($row),
            'current_queue_number' => $row['queue_batch'],
            'batch_start' => $row['batch_start'],
            'batch_end' => $row['batch_end'],
            'history' => $history,
        ]);
        $conn->close();
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
        $conn->close();
        exit();
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? [];
    $batchInput = trim((string) ($input['batch'] ?? ''));
    $parsed = parseQueueBatchRange($batchInput);

    if (!$parsed) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Queue batch must use the format YYYYMMDD-01 or YYYYMMDD-01 to YYYYMMDD-50.',
        ]);
        $conn->close();
        exit();
    }

    $existing = $conn->query("SELECT id FROM queue_batch_settings WHERE batch_date = '{$parsed['batch_date']}' ORDER BY id DESC LIMIT 1");

    if ($existing && $existing->num_rows > 0) {
        $row = $existing->fetch_assoc();
        $stmt = $conn->prepare("UPDATE queue_batch_settings SET queue_batch = ?, batch_start = ?, batch_end = ?, current_number = ? WHERE id = ?");
        $currentNumber = 1;
        $batchSequence = queueBatchSequence($parsed['queue_batch']);
        if ($batchSequence > 0) {
            $currentNumber = $batchSequence;
        }
        $rowId = (int) $row['id'];
        $stmt->bind_param('sssii', $parsed['queue_batch'], $parsed['batch_start'], $parsed['batch_end'], $currentNumber, $rowId);
        $stmt->execute();
        $stmt->close();
    } else {
        $stmt = $conn->prepare("INSERT INTO queue_batch_settings (batch_date, queue_batch, batch_start, batch_end, current_number) VALUES (?, ?, ?, ?, 1)");
        $stmt->bind_param('ssss', $parsed['batch_date'], $parsed['queue_batch'], $parsed['batch_start'], $parsed['batch_end']);
        $stmt->execute();
        $stmt->close();
    }

    $rangeText = buildBatchRangeText($parsed);
    echo json_encode([
        'success' => true,
        'batch' => $rangeText,
        'queue_batch' => $rangeText,
        'current_queue_number' => $parsed['queue_batch'],
        'batch_start' => $parsed['batch_start'],
        'batch_end' => $parsed['batch_end'],
        'message' => 'Queue batch updated successfully.',
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to update queue batch.']);
} finally {
    if ($conn) {
        $conn->close();
    }
}
