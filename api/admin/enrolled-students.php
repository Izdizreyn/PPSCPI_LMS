<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

requireRole(['purple_admin']);

$studentsResult = $conn->query("SELECT * FROM enrolled_students ORDER BY level, year_level, room, full_name");
$students = [];
while ($row = $studentsResult->fetch_assoc()) {
    $students[] = $row;
}

$roomsResult = $conn->query("SELECT * FROM rooms ORDER BY level, year_level, room_name");
$rooms = [];
while ($row = $roomsResult->fetch_assoc()) {
    $rooms[] = $row;
}

echo json_encode(["success" => true, "students" => $students, "rooms" => $rooms]);
$conn->close();