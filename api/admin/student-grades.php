<?php
// Grade entry for one student, one quarter: all subjects for their year
// level (+strand), with any existing grade/status/remarks.
require_once __DIR__ . '/../helpers/grades_helper.php';
require_once __DIR__ . '/../helpers/teacher_helper.php';
$user = g_user(['purple_teacher']);
$teacherId = (int) $user['user_id'];
teacherEnsureRoomSchema($conn);
$actorId = (int) $user['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $lrn = trim($_GET['lrn'] ?? '');
    if ($lrn === '') g_json(['success' => false, 'message' => 'LRN is required.'], 400);
    $quarter = g_quarter($_GET['quarter'] ?? 0);
    $sy = g_school_year($_GET['school_year'] ?? null);

    $student = g_student($conn, $lrn);
    if (!teacherCanAccessStudent($conn, $teacherId, $student)) {
        g_json(['success' => false, 'message' => 'You can only view grades for students in your assigned advisory rooms.'], 403);
    }
    $subjects = g_subjects_for($conn, $student['year_level'], $student['strand'] ?: null);

    $g = $conn->prepare('SELECT subject_id, grade, status, remarks FROM grades WHERE student_lrn = ? AND school_year = ? AND quarter = ?');
    $g->bind_param('ssi', $lrn, $sy, $quarter);
    $g->execute();
    $existing = [];
    foreach ($g->get_result()->fetch_all(MYSQLI_ASSOC) as $row) {
        $existing[(int) $row['subject_id']] = $row;
    }
    $g->close();

    $rows = array_map(function ($subj) use ($existing) {
        $e = $existing[(int) $subj['id']] ?? null;
        return [
            'subject_id' => (int) $subj['id'],
            'subject' => $subj['name'],
            'grade' => $e['grade'] ?? null,
            'status' => $e['status'] ?? null,
            'remarks' => $e['remarks'] ?? null,
        ];
    }, $subjects);

    g_json(['success' => true, 'student' => $student, 'quarter' => $quarter, 'school_year' => $sy, 'subjects' => $rows]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    $b = g_body();
    $lrn = trim($b['lrn'] ?? '');
    if ($lrn === '') g_json(['success' => false, 'message' => 'LRN is required.'], 400);
    $quarter = g_quarter($b['quarter'] ?? 0);
    $sy = g_school_year($b['school_year'] ?? null);
    $items = $b['grades'] ?? [];
    if (!is_array($items) || !$items) g_json(['success' => false, 'message' => 'No grades supplied.'], 400);

    $student = g_student($conn, $lrn);
    if (!teacherCanAccessStudent($conn, $teacherId, $student)) {
        g_json(['success' => false, 'message' => 'You can only update grades for students in your assigned advisory rooms.'], 403);
    }
    $validSubjectIds = array_column(g_subjects_for($conn, $student['year_level'], $student['strand'] ?: null), 'id');

    $lock = $conn->prepare("SELECT COUNT(*) AS n FROM grades WHERE student_lrn=? AND school_year=? AND quarter=? AND status IN ('Submitted','Validated','Released')");
    $lock->bind_param('ssi', $lrn, $sy, $quarter);
    $lock->execute();
    $lockCount = (int) $lock->get_result()->fetch_assoc()['n'];
    $lock->close();
    if ($lockCount > 0) g_json(['success' => false, 'message' => 'This quarter is locked and can no longer be edited.'], 409);

    $conn->begin_transaction();
    try {
        $sel = $conn->prepare('SELECT id, grade FROM grades WHERE student_lrn=? AND subject_id=? AND school_year=? AND quarter=?');
        $ins = $conn->prepare("INSERT INTO grades (student_lrn, subject_id, school_year, quarter, grade, status) VALUES (?,?,?,?,?, 'Draft')");
        $upd = $conn->prepare("UPDATE grades SET grade=?, status='Draft', remarks=NULL WHERE id=?");

        foreach ($items as $it) {
            $subjectId = (int) ($it['subject_id'] ?? 0);
            $gradeInput = $it['grade'] ?? null;
            if (!in_array($subjectId, $validSubjectIds, true)) throw new Exception("Subject is not valid for this student's year level.");
            if (!is_numeric($gradeInput) || $gradeInput < 60 || $gradeInput > 100) throw new Exception('Each grade must be between 60 and 100.');
            $gradeVal = (float) $gradeInput;

            $sel->bind_param('sisi', $lrn, $subjectId, $sy, $quarter);
            $sel->execute();
            $existing = $sel->get_result()->fetch_assoc();

            if ($existing) {
                if ((float) $existing['grade'] !== $gradeVal) {
                    $existingId = (int) $existing['id'];
                    $upd->bind_param('di', $gradeVal, $existingId);
                    $upd->execute();
                    g_audit($conn, $existingId, $actorId, 'edit', $existing['grade'], $gradeVal);
                }
            } else {
                $ins->bind_param('sissd', $lrn, $subjectId, $sy, $quarter, $gradeVal);
                $ins->execute();
                g_audit($conn, (int) $conn->insert_id, $actorId, 'create', null, $gradeVal);
            }
        }
        $sel->close();
        $ins->close();
        $upd->close();

        $conn->commit();
        g_json(['success' => true, 'message' => 'Draft saved.']);
    } catch (Exception $e) {
        $conn->rollback();
        g_json(['success' => false, 'message' => $e->getMessage()], 422);
    }
}

g_json(['success' => false, 'message' => 'Method not allowed.'], 405);
