<?php
require_once __DIR__ . '/../helpers/grades_helper.php';
require_once __DIR__ . '/../helpers/teacher_helper.php';
$user = g_user(['purple_teacher']);
teacherEnsureRoomSchema($conn);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') g_json(['success' => false, 'message' => 'Method not allowed.'], 405);

$actorId = (int) $user['user_id'];
$b = g_body();
$lrn = trim($b['lrn'] ?? '');
if ($lrn === '') g_json(['success' => false, 'message' => 'LRN is required.'], 400);
$quarter = g_quarter($b['quarter'] ?? 0);
$sy = g_school_year($b['school_year'] ?? null);

$student = g_student($conn, $lrn);
if (!teacherCanAccessStudent($conn, (int) $user['user_id'], $student)) {
    g_json(['success' => false, 'message' => 'You can only submit grades for students in your assigned advisory rooms.'], 403);
}
$expected = count(g_subjects_for($conn, $student['year_level'], $student['strand'] ?: null));

$conn->begin_transaction();
try {
    $st = $conn->prepare('SELECT id, status FROM grades WHERE student_lrn=? AND school_year=? AND quarter=? FOR UPDATE');
    $st->bind_param('ssi', $lrn, $sy, $quarter);
    $st->execute();
    $rows = $st->get_result()->fetch_all(MYSQLI_ASSOC);
    $st->close();

    if ($expected === 0 || count($rows) < $expected) throw new Exception('Every subject needs a grade before submitting.');
    foreach ($rows as $r) {
        if (!in_array($r['status'], ['Draft', 'Returned'], true)) throw new Exception('This quarter was already submitted.');
    }

    $upd = $conn->prepare("UPDATE grades SET status='Submitted', submitted_at=NOW(), remarks=NULL WHERE id=?");
    foreach ($rows as $r) {
        $gradeId = (int) $r['id'];
        $upd->bind_param('i', $gradeId);
        $upd->execute();
        g_audit($conn, $gradeId, $actorId, 'submit', $r['status'], 'Submitted');
    }
    $upd->close();

    $conn->commit();
    g_json(['success' => true, 'message' => 'Grades submitted for validation.']);
} catch (Exception $e) {
    $conn->rollback();
    g_json(['success' => false, 'message' => $e->getMessage()], 422);
}
