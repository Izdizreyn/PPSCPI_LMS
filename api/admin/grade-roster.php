<?php
require_once __DIR__ . '/../helpers/grades_helper.php';
require_once __DIR__ . '/../helpers/teacher_helper.php';
$user = g_user(['purple_teacher']);
teacherEnsureRoomSchema($conn);

$sy = g_school_year($_GET['school_year'] ?? null);

$teacherId = (int) $user['user_id'];
$roomsStmt = $conn->prepare('SELECT r.id, r.room_name, r.level, r.year_level
    FROM teacher_advisory_rooms a
    JOIN rooms r ON r.id = a.room_id
    WHERE a.teacher_user_id = ?
    ORDER BY r.level, r.year_level, r.room_name');
$roomsStmt->bind_param('i', $teacherId);
$roomsStmt->execute();
$rooms = $roomsStmt->get_result()->fetch_all(MYSQLI_ASSOC);
$roomsStmt->close();

$stmt = $conn->prepare("SELECT es.lrn, es.full_name, es.year_level, es.strand, es.room, es.level,
        r.id AS room_id
    FROM teacher_advisory_rooms a
    JOIN rooms r ON r.id = a.room_id
    JOIN enrolled_students es
        ON es.room = r.room_name
        AND es.year_level = r.year_level
        AND es.level = r.level
    WHERE a.teacher_user_id = ?
    ORDER BY r.room_name, es.full_name");
$stmt->bind_param('i', $teacherId);
$stmt->execute();
$students = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

$q = $conn->prepare('SELECT DISTINCT status FROM grades WHERE student_lrn = ? AND school_year = ? AND quarter = ?');

foreach ($students as &$s) {
    $s['quarters'] = [1 => 'Empty', 2 => 'Empty', 3 => 'Empty', 4 => 'Empty'];
    for ($quarter = 1; $quarter <= 4; $quarter++) {
        $q->bind_param('ssi', $s['lrn'], $sy, $quarter);
        $q->execute();
        $statuses = array_column($q->get_result()->fetch_all(MYSQLI_ASSOC), 'status');
        if (count($statuses) === 1) {
            $s['quarters'][$quarter] = $statuses[0];
        } elseif (count($statuses) > 1) {
            $s['quarters'][$quarter] = 'Mixed';
        }
    }
}
unset($s);
$q->close();

g_json(['success' => true, 'school_year' => $sy, 'rooms' => $rooms, 'students' => $students]);
