<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

requireRole(['purple_admin']);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $year = $_GET['year'] ?? '';
    $strand = $_GET['strand'] ?? '';

    if ($year >= 11 && $year <= 12) {
        $stmt = $conn->prepare("SELECT * FROM rooms WHERE level = 'Senior High School' AND year_level = ? AND room_name LIKE ? AND current_count < capacity");
        $likeStrand = "%$strand%";
        $stmt->bind_param("ss", $year, $likeStrand);
    } elseif ($year >= 7 && $year <= 10) {
        $stmt = $conn->prepare("SELECT * FROM rooms WHERE level = 'Junior High School' AND year_level = ? AND current_count < capacity");
        $stmt->bind_param("s", $year);
    } elseif ($year >= 1 && $year <= 6) {
        $stmt = $conn->prepare("SELECT * FROM rooms WHERE level = 'Elementary' AND year_level = ? AND current_count < capacity");
        $stmt->bind_param("s", $year);
    } elseif ($year === 'Kinder') {
        $stmt = $conn->prepare("SELECT * FROM rooms WHERE level = 'Kinder' AND current_count < capacity");
    } elseif ($year === 'Nursery') {
        $stmt = $conn->prepare("SELECT * FROM rooms WHERE level = 'Nursery' AND current_count < capacity");
    } else {
        $stmt = $conn->prepare("SELECT * FROM rooms WHERE current_count < capacity LIMIT 10");
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $rooms = [];
    while ($row = $result->fetch_assoc()) $rooms[] = $row;
    $stmt->close();

    echo json_encode(["success" => true, "rooms" => $rooms]);
    $conn->close();
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    $lrn = $input['lrn'] ?? '';
    $name = $input['name'] ?? '';
    $year = $input['year'] ?? '';
    $strand = $input['strand'] ?? '';
    $roomId = $input['room_id'] ?? '';

    if (empty($lrn) || empty($name) || empty($year) || empty($roomId)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Missing required fields."]);
        exit();
    }

    $stmt = $conn->prepare("SELECT * FROM enrolled_students WHERE lrn = ?");
    $stmt->bind_param("s", $lrn);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        $stmt->close();
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Student with LRN $lrn is already enrolled."]);
        exit();
    }
    $stmt->close();

    $stmt = $conn->prepare("SELECT * FROM rooms WHERE id = ?");
    $stmt->bind_param("i", $roomId);
    $stmt->execute();
    $roomData = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$roomData) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Room not found."]);
        exit();
    }

    if ($roomData['current_count'] >= $roomData['capacity']) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Selected room is already full."]);
        exit();
    }

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare("INSERT INTO enrolled_students (lrn, full_name, year_level, strand, room, level) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssss", $lrn, $name, $year, $strand, $roomData['room_name'], $roomData['level']);
        $stmt->execute();
        $stmt->close();

        $stmt = $conn->prepare("UPDATE rooms SET current_count = current_count + 1 WHERE id = ?");
        $stmt->bind_param("i", $roomId);
        $stmt->execute();
        $stmt->close();

        $conn->commit();
        echo json_encode(["success" => true, "message" => "Student successfully enrolled in {$roomData['room_name']}."]);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error enrolling student: " . $e->getMessage()]);
    }

    $conn->close();
    exit();
}

http_response_code(405);
echo json_encode(["success" => false, "message" => "Method not allowed."]);