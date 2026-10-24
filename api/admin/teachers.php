<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../helpers/teacher_helper.php';

requireRole(['purple_admin']);
try {
    teacherEnsureRoomSchema($conn);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $error->getMessage()]);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $conn->query("SELECT a.id_admin, a.username_admin,
            GROUP_CONCAT(r.room_name ORDER BY r.room_name SEPARATOR ', ') AS advisory_rooms
        FROM admin a
        LEFT JOIN teacher_advisory_rooms t ON t.teacher_user_id = a.id_admin
        LEFT JOIN rooms r ON r.id = t.room_id
        WHERE a.role = 'purple_teacher'
        GROUP BY a.id_admin, a.username_admin
        ORDER BY a.username_admin");
    $teachers = $result->fetch_all(MYSQLI_ASSOC);
    echo json_encode(['success' => true, 'teachers' => $teachers]);
    $conn->close();
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $username = trim((string) ($body['username'] ?? ''));
    $password = (string) ($body['password'] ?? '');

    if (!preg_match('/^[A-Za-z0-9_.-]{3,40}$/', $username)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Username must be 3-40 letters, numbers, dots, underscores, or hyphens.']);
        exit();
    }
    if (strlen($password) < 8 || strlen($password) > 255) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password must be between 8 and 255 characters.']);
        exit();
    }

    try {
        teacherEnsureUsernameIndex($conn);
    } catch (Throwable $error) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $error->getMessage()]);
        exit();
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO admin (username_admin, password_admin, role) VALUES (?, ?, 'purple_teacher')");
    $stmt->bind_param('ss', $username, $passwordHash);
    try {
        $stmt->execute();
    } catch (mysqli_sql_exception $error) {
        $stmt->close();
        if ((int) $error->getCode() === 1062) {
            http_response_code(409);
            echo json_encode(['success' => false, 'message' => 'That username is already in use.']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Teacher account could not be created.']);
        }
        exit();
    }
    $teacherId = (int) $stmt->insert_id;
    $stmt->close();

    echo json_encode([
        'success' => true,
        'message' => 'Teacher account created. The teacher can sign in and select advisory rooms.',
        'teacher' => ['id' => $teacherId, 'username' => $username],
    ]);
    $conn->close();
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
$conn->close();
