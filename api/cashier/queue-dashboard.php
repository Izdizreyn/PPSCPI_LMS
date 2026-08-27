<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

requireRole(['purple_cashier']);

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
    echo json_encode(['success' => false, 'message' => 'Unable to load the queue dashboard.']);
    $conn->close();
    exit();
}

echo json_encode([
    'success' => true,
    'queue' => $queue,
    'updated_at' => date('c'),
]);

$conn->close();
