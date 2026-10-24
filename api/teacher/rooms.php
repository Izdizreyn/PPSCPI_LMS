<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/teacher_helper.php';

$user = requireRole(['purple_teacher']);
$teacherId = (int) ($user['user_id'] ?? 0);

try {
    teacherEnsureRoomSchema($conn);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $error->getMessage()]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->prepare('SELECT r.id, r.room_name, r.level, r.year_level,
            r.capacity, r.current_count,
            CASE WHEN own.room_id IS NULL THEN 0 ELSE 1 END AS assigned_to_self
        FROM rooms r
        LEFT JOIN teacher_advisory_rooms own
            ON own.room_id = r.id AND own.teacher_user_id = ?
        WHERE own.room_id IS NOT NULL
           OR NOT EXISTS (
               SELECT 1 FROM teacher_advisory_rooms other
               WHERE other.room_id = r.id AND other.teacher_user_id <> ?
           )
        ORDER BY r.level, r.year_level, r.room_name');
    $stmt->bind_param('ii', $teacherId, $teacherId);
    $stmt->execute();
    $rooms = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    $assignedIds = array_values(array_map(
        static fn($room) => (int) $room['id'],
        array_filter($rooms, static fn($room) => (int) $room['assigned_to_self'] === 1)
    ));
    echo json_encode(['success' => true, 'rooms' => $rooms, 'room_ids' => $assignedIds]);
    $conn->close();
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $roomIds = $body['room_ids'] ?? null;
    if (!is_array($roomIds)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'A list of advisory room IDs is required.']);
        exit();
    }

    $validatedRoomIds = [];
    foreach ($roomIds as $roomId) {
        if ((!is_int($roomId) && !(is_string($roomId) && ctype_digit($roomId))) || (int) $roomId < 1) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Each advisory room ID must be a positive integer.']);
            exit();
        }
        $validatedRoomIds[] = (int) $roomId;
    }
    $roomIds = array_values(array_unique($validatedRoomIds));

    try {
        $conn->begin_transaction();
        $delete = $conn->prepare('DELETE FROM teacher_advisory_rooms WHERE teacher_user_id = ?');
        $delete->bind_param('i', $teacherId);
        $delete->execute();
        $delete->close();

        $available = $conn->prepare('SELECT r.id
            FROM rooms r
            WHERE r.id = ?
              AND NOT EXISTS (
                  SELECT 1 FROM teacher_advisory_rooms other
                  WHERE other.room_id = r.id
              )
            LIMIT 1');
        $insert = $conn->prepare('INSERT INTO teacher_advisory_rooms (teacher_user_id, room_id) VALUES (?, ?)');
        foreach ($roomIds as $roomId) {
            $available->bind_param('i', $roomId);
            $available->execute();
            if (!$available->get_result()->fetch_row()) {
                throw new DomainException('One or more rooms are no longer available. Refresh and try again.');
            }
            $insert->bind_param('ii', $teacherId, $roomId);
            $insert->execute();
        }
        $available->close();
        $insert->close();
        $conn->commit();

        echo json_encode(['success' => true, 'message' => 'Advisory rooms saved.']);
    } catch (DomainException $error) {
        $conn->rollback();
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => $error->getMessage()]);
    } catch (mysqli_sql_exception $error) {
        $conn->rollback();
        http_response_code(in_array((int) $error->getCode(), [1062, 1452], true) ? 409 : 500);
        echo json_encode([
            'success' => false,
            'message' => in_array((int) $error->getCode(), [1062, 1452], true)
                ? 'One or more rooms are no longer available. Refresh and try again.'
                : 'Advisory rooms could not be saved.',
        ]);
    } catch (Throwable $error) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Advisory rooms could not be saved.']);
    }
    $conn->close();
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
$conn->close();
