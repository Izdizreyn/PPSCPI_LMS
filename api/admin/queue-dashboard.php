<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

requireRole(['purple_admin']);

function ensureQueueBatchSchema($conn)
{
    $columns = [];
    $result = $conn->query("SHOW COLUMNS FROM queue_batch_settings");
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $columns[] = $row['Field'];
        }
    }

    $requiredColumns = [
        'batch_date' => "ALTER TABLE queue_batch_settings ADD COLUMN batch_date DATE NULL AFTER id",
        'queue_batch' => "ALTER TABLE queue_batch_settings ADD COLUMN queue_batch VARCHAR(20) NULL AFTER batch_date",
        'batch_start' => "ALTER TABLE queue_batch_settings ADD COLUMN batch_start VARCHAR(20) NULL AFTER queue_batch",
        'batch_end' => "ALTER TABLE queue_batch_settings ADD COLUMN batch_end VARCHAR(20) NULL AFTER batch_start",
        'current_number' => "ALTER TABLE queue_batch_settings ADD COLUMN current_number INT NOT NULL DEFAULT 1 AFTER batch_end",
    ];

    foreach ($requiredColumns as $column => $alterSql) {
        if (!in_array($column, $columns, true)) {
            $conn->query($alterSql);
        }
    }

    $conn->query("UPDATE queue_batch_settings
        SET batch_date = COALESCE(batch_date, CURDATE()),
            queue_batch = COALESCE(queue_batch, CONCAT(DATE_FORMAT(CURDATE(), '%Y%m%d'), '-001')),
            batch_start = COALESCE(batch_start, CONCAT(DATE_FORMAT(CURDATE(), '%Y%m%d'), '-001')),
            batch_end = COALESCE(batch_end, CONCAT(DATE_FORMAT(CURDATE(), '%Y%m%d'), '-100')),
            current_number = COALESCE(current_number, 1)
        WHERE batch_date IS NULL
           OR queue_batch IS NULL
           OR batch_start IS NULL
           OR batch_end IS NULL
           OR current_number IS NULL");
}

ensureQueueBatchSchema($conn);

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

$sql = "SELECT
            schedule.queue_number,
            schedule.enrollment_date,
            schedule.enrollee_name,
            schedule.lrn,
            schedule.student_type,
            schedule.student_id,
              CASE WHEN schedule.status = 'Settled' THEN 'Used'
                  ELSE COALESCE(schedule.status, 'Active') END AS status,
            student.year_level,
            student.strand
        FROM enrollment_schedule AS schedule
        LEFT JOIN (
            SELECT id_new AS student_id, 'new' AS student_type,
                   yr_lvl_new AS year_level, strand_new AS strand
            FROM new_student_info
            UNION ALL
            SELECT id_old AS student_id, 'old' AS student_type,
                   yr_lvl_old AS year_level, strand_old AS strand
            FROM old_student_info
            UNION ALL
            SELECT id_trans AS student_id, 'transferee' AS student_type,
                   yr_lvl_trans AS year_level, strand_trans AS strand
            FROM transferee_info
        ) AS student ON student.student_id = schedule.student_id
            AND student.student_type = schedule.student_type
        ORDER BY
            CASE WHEN schedule.status IN ('Used', 'Settled') THEN 1 ELSE 0 END,
            schedule.enrollment_date ASC";

$result = $conn->query($sql);
$queue = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $queue[] = $row;
    }
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Unable to load the queue dashboard.',
    ]);
    $conn->close();
    exit();
}

$batchResult = $conn->query("SELECT * FROM queue_batch_settings WHERE batch_date = CURDATE() ORDER BY id DESC LIMIT 1");
$queueBatch = date('Ymd') . '-001';
$batchStart = date('Ymd') . '-001';
$batchEnd = date('Ymd') . '-100';

if ($batchResult && $batchResult->num_rows === 0) {
    $fallbackResult = $conn->query("SELECT * FROM queue_batch_settings ORDER BY batch_date DESC, id DESC LIMIT 1");
    if ($fallbackResult && $fallbackResult->num_rows > 0) {
        $fallbackRow = $fallbackResult->fetch_assoc();
        if (!empty($fallbackRow['queue_batch'])) {
            $queueBatch = $fallbackRow['queue_batch'];
        }
        if (!empty($fallbackRow['batch_start'])) {
            $batchStart = $fallbackRow['batch_start'];
        }
        if (!empty($fallbackRow['batch_end'])) {
            $batchEnd = $fallbackRow['batch_end'];
        }
    }
}

if ($batchResult && $batchResult->num_rows > 0) {
    $batchRow = $batchResult->fetch_assoc();
    if (!empty($batchRow['queue_batch'])) {
        $queueBatch = $batchRow['queue_batch'];
    }
    if (!empty($batchRow['batch_start'])) {
        $batchStart = $batchRow['batch_start'];
    }
    if (!empty($batchRow['batch_end'])) {
        $batchEnd = $batchRow['batch_end'];
    }
}

$historyResult = $conn->query("SELECT batch_date, batch_start, batch_end, last_queue_number FROM queue_batch_history WHERE batch_date <= CURDATE() ORDER BY batch_date DESC, id DESC LIMIT 10");
$history = [];
if ($historyResult) {
    while ($row = $historyResult->fetch_assoc()) {
        $history[] = $row;
    }
}

echo json_encode([
    'success' => true,
    'queue' => $queue,
    'queue_batch' => $batchStart . ' to ' . $batchEnd,
    'current_queue_number' => $queueBatch,
    'batch_start' => $batchStart,
    'batch_end' => $batchEnd,
    'history' => $history,
    'updated_at' => date('c'),
]);

$conn->close();