<?php
// Lists/opens submitted grade batches, now grouped by STUDENT + quarter
// (one shared admin account enters grades for any student, so there is
// no "my classes" scope — every staff member sees every batch).
require_once __DIR__ . '/../helpers/grades_helper.php';
g_user(['purple_admin']);

// Detail of one student's quarter batch
if (isset($_GET['lrn']) && isset($_GET['quarter'])) {
    $lrn = trim($_GET['lrn']);
    $quarter = g_quarter($_GET['quarter']);
    $sy = g_school_year($_GET['school_year'] ?? null);

    $student = g_student($conn, $lrn);

    $rowsStmt = $conn->prepare('SELECT g.subject_id, s.name AS subject, g.grade, g.status, g.remarks
        FROM grades g
        JOIN subjects s ON s.id = g.subject_id
        WHERE g.student_lrn = ? AND g.school_year = ? AND g.quarter = ?
        ORDER BY s.name');
    $rowsStmt->bind_param('ssi', $lrn, $sy, $quarter);
    $rowsStmt->execute();
    $grades = $rowsStmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $rowsStmt->close();

    if (!$grades) g_json(['success' => false, 'message' => 'No grades found for this student and quarter.'], 404);

    g_json([
        'success' => true,
        'batch' => [
            'lrn' => $student['lrn'],
            'full_name' => $student['full_name'],
            'year_level' => $student['year_level'],
            'strand' => $student['strand'],
            'quarter' => $quarter,
        ],
        'grades' => $grades,
    ]);
}

// List of batches by status
$status = $_GET['status'] ?? 'Submitted';
if (!in_array($status, ['Submitted', 'Validated', 'Returned', 'Released'], true)) g_json(['success' => false, 'message' => 'Invalid status.'], 400);

$st = $conn->prepare("SELECT g.student_lrn AS lrn, es.full_name, es.year_level, es.strand, g.quarter, g.status,
        COUNT(*) AS subjects, MAX(g.submitted_at) AS submitted_at
    FROM grades g
    LEFT JOIN enrolled_students es ON es.lrn = g.student_lrn COLLATE utf8mb4_unicode_ci
    WHERE g.status = ?
    GROUP BY g.student_lrn, es.full_name, es.year_level, es.strand, g.quarter, g.status
    ORDER BY submitted_at DESC");
$st->bind_param('s', $status);
$st->execute();
$batches = $st->get_result()->fetch_all(MYSQLI_ASSOC);
$st->close();

g_json(['success' => true, 'batches' => $batches]);
