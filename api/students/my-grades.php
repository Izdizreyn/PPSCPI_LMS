<?php
require_once __DIR__ . '/../helpers/grades_helper.php';
$user = g_user(['purple_student']);
$studentId = (int) $user['user_id'];

$st = $conn->prepare('SELECT lrn FROM students WHERE id_student = ?');
$st->bind_param('i', $studentId);
$st->execute();
$row = $st->get_result()->fetch_assoc();
$st->close();
$lrn = $row['lrn'] ?? null;
if (!$lrn) g_json(['success' => false, 'message' => 'Student record not found.'], 404);

$sy = g_school_year($_GET['school_year'] ?? null);

$g = $conn->prepare("SELECT s.name AS subject, g.quarter, g.grade
    FROM grades g JOIN subjects s ON s.id = g.subject_id
    WHERE g.student_lrn = ? AND g.school_year = ? AND g.status = 'Released'
    ORDER BY s.name, g.quarter");
$g->bind_param('ss', $lrn, $sy);
$g->execute();
$rows = $g->get_result()->fetch_all(MYSQLI_ASSOC);
$g->close();

$subjects = [];
foreach ($rows as $r) {
    $name = $r['subject'];
    $subjects[$name]['subject'] = $name;
    $subjects[$name]['quarters'][(int) $r['quarter']] = (float) $r['grade'];
}
foreach ($subjects as &$s) {
    $s['final'] = count($s['quarters']) === 4 ? round(array_sum($s['quarters']) / 4, 2) : null;
}
unset($s);

g_json(['success' => true, 'school_year' => $sy, 'subjects' => array_values($subjects)]);
