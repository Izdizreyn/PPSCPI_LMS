<?php
require_once __DIR__ . '/../helpers/grades_helper.php';
require_once __DIR__ . '/../helpers/teacher_helper.php';
$user = g_user(['purple_teacher']);
$teacherId = (int) $user['user_id'];
teacherEnsureRoomSchema($conn);
$sy = g_school_year($_GET['school_year'] ?? null);

$stmt = $conn->prepare('SELECT r.id, r.room_name AS room, r.level, r.year_level
    FROM teacher_advisory_rooms a
    JOIN rooms r ON r.id = a.room_id
    WHERE a.teacher_user_id = ?
    ORDER BY r.room_name');
$stmt->bind_param('i', $teacherId);
$stmt->execute();
$classes = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

g_json(['success' => true, 'school_year' => $sy, 'classes' => $classes]);
