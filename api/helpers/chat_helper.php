<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/teacher_helper.php';

function chatEnsureSchema(mysqli $conn): void
{
    $conn->query("CREATE TABLE IF NOT EXISTS student_chat_conversations (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        conversation_key VARCHAR(191) NOT NULL UNIQUE,
        conversation_type ENUM('staff', 'section') NOT NULL,
        student_lrn VARCHAR(50) DEFAULT NULL,
        room_name VARCHAR(100) DEFAULT NULL,
        year_level VARCHAR(50) DEFAULT NULL,
        strand VARCHAR(100) DEFAULT NULL,
        room_level VARCHAR(50) DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_chat_conversation_student (conversation_type, student_lrn),
        INDEX idx_chat_conversation_section (conversation_type, room_name, year_level, strand)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    $levelColumn = $conn->query("SHOW COLUMNS FROM student_chat_conversations LIKE 'room_level'");
    if (!$levelColumn) {
        throw new RuntimeException('Room chat schema could not be inspected.');
    }
    if ($levelColumn->num_rows === 0 && !$conn->query('ALTER TABLE student_chat_conversations ADD COLUMN room_level VARCHAR(50) DEFAULT NULL AFTER strand')) {
        throw new RuntimeException('Room chat level support could not be initialized.');
    }

    $conn->query("CREATE TABLE IF NOT EXISTS student_chat_messages (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        conversation_id BIGINT UNSIGNED NOT NULL,
        sender_role ENUM('student', 'staff') NOT NULL,
        sender_id BIGINT UNSIGNED NOT NULL,
        sender_lrn VARCHAR(50) DEFAULT NULL,
        sender_name VARCHAR(255) NOT NULL,
        message_text TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_chat_messages_conversation (conversation_id, id),
        CONSTRAINT fk_student_chat_message_conversation
            FOREIGN KEY (conversation_id) REFERENCES student_chat_conversations(id)
            ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $conn->query("CREATE TABLE IF NOT EXISTS student_chat_reads (
        conversation_id BIGINT UNSIGNED NOT NULL,
        reader_role ENUM('student', 'staff') NOT NULL,
        reader_id BIGINT UNSIGNED NOT NULL,
        last_read_message_id BIGINT UNSIGNED NOT NULL DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (conversation_id, reader_role, reader_id),
        CONSTRAINT fk_student_chat_read_conversation
            FOREIGN KEY (conversation_id) REFERENCES student_chat_conversations(id)
            ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
}

function chatRole(array $user): string
{
    if (($user['role'] ?? '') === 'purple_student') {
        return 'student';
    }

    if (in_array(($user['role'] ?? ''), ['purple_teacher', 'purple_admin'], true)) {
        return 'staff';
    }

    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Chat is available to students, teachers, and administrators only.']);
    exit();
}

function chatStudentRecord(mysqli $conn, array $user): array
{
    $lrn = trim((string) ($user['lrn'] ?? ''));
    if ($lrn === '') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'A student LRN is required to use chat.']);
        exit();
    }

    $stmt = $conn->prepare('SELECT lrn, full_name, room, year_level, strand, level FROM enrolled_students WHERE lrn = ? LIMIT 1');
    $stmt->bind_param('s', $lrn);
    $stmt->execute();
    $student = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$student) {
        $stmt = $conn->prepare('SELECT lrn, full_name FROM students WHERE lrn = ? LIMIT 1');
        $stmt->bind_param('s', $lrn);
        $stmt->execute();
        $student = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$student) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Student account information could not be found.']);
            exit();
        }

        $student += [
            'room' => '',
            'year_level' => '',
            'strand' => '',
            'level' => '',
        ];
    }

    return $student;
}

function chatGetOrCreateConversation(
    mysqli $conn,
    string $key,
    string $type,
    ?string $lrn = null,
    ?string $room = null,
    ?string $yearLevel = null,
    ?string $strand = null,
    ?string $roomLevel = null
): int {
    $stmt = $conn->prepare('INSERT INTO student_chat_conversations
        (conversation_key, conversation_type, student_lrn, room_name, year_level, strand, room_level)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)');
    $stmt->bind_param('sssssss', $key, $type, $lrn, $room, $yearLevel, $strand, $roomLevel);
    $stmt->execute();
    $stmt->close();

    $stmt = $conn->prepare('SELECT id FROM student_chat_conversations WHERE conversation_key = ? LIMIT 1');
    $stmt->bind_param('s', $key);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    return (int) ($row['id'] ?? 0);
}

function chatStudentConversationIds(mysqli $conn, array $student): array
{
    $studentLrn = trim((string) ($student['lrn'] ?? ''));
    if ($studentLrn === '') {
        return [];
    }

    $directId = chatGetOrCreateConversation(
        $conn,
        'staff:' . hash('sha256', $studentLrn),
        'staff',
        $studentLrn
    );
    $conversationIds = [$directId];

    if (trim((string) ($student['room'] ?? '')) === '' || trim((string) ($student['year_level'] ?? '')) === '') {
        return $conversationIds;
    }

    $isSeniorHigh = stripos((string) ($student['level'] ?? ''), 'Senior High') !== false;
    $strand = $isSeniorHigh ? trim((string) ($student['strand'] ?? '')) : '';
    if ($isSeniorHigh && $strand === '') {
        return $conversationIds;
    }

    $groupDetails = [
        'room' => trim((string) ($student['room'] ?? '')),
        'year_level' => trim((string) ($student['year_level'] ?? '')),
        'strand' => $strand,
        'level' => trim((string) ($student['level'] ?? '')),
    ];
    $sectionKey = 'section:' . hash('sha256', json_encode($groupDetails));
    $sectionId = chatGetOrCreateConversation(
        $conn,
        $sectionKey,
        'section',
        null,
        $groupDetails['room'],
        $groupDetails['year_level'],
        $groupDetails['strand'],
        $groupDetails['level']
    );

    $conversationIds[] = $sectionId;
    return $conversationIds;
}

function chatConversationSummary(
    mysqli $conn,
    array $conversation,
    string $readerRole,
    int $readerId,
    string $title
): array {
    $conversationId = (int) $conversation['id'];
    $lastStmt = $conn->prepare('SELECT message_text, sender_name, created_at
        FROM student_chat_messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1');
    $lastStmt->bind_param('i', $conversationId);
    $lastStmt->execute();
    $lastMessage = $lastStmt->get_result()->fetch_assoc();
    $lastStmt->close();

    if ($readerRole === 'student' && $conversation['conversation_type'] === 'section') {
        $unreadStmt = $conn->prepare('SELECT COUNT(*) AS unread_count
            FROM student_chat_messages m
            WHERE m.conversation_id = ?
              AND NOT (m.sender_role = "student" AND m.sender_id = ?)
              AND m.id > COALESCE((
                  SELECT r.last_read_message_id FROM student_chat_reads r
                  WHERE r.conversation_id = ? AND r.reader_role = ? AND r.reader_id = ?
              ), 0)');
        $unreadStmt->bind_param('iiisi', $conversationId, $readerId, $conversationId, $readerRole, $readerId);
    } else {
        $senderRole = $readerRole === 'student' ? 'staff' : 'student';
        $unreadStmt = $conn->prepare('SELECT COUNT(*) AS unread_count
            FROM student_chat_messages m
            WHERE m.conversation_id = ? AND m.sender_role = ?
              AND m.id > COALESCE((
                  SELECT r.last_read_message_id FROM student_chat_reads r
                  WHERE r.conversation_id = ? AND r.reader_role = ? AND r.reader_id = ?
              ), 0)');
        $unreadStmt->bind_param('isisi', $conversationId, $senderRole, $conversationId, $readerRole, $readerId);
    }
    $unreadStmt->execute();
    $unreadCount = (int) $unreadStmt->get_result()->fetch_assoc()['unread_count'];
    $unreadStmt->close();

    return [
        'id' => $conversationId,
        'type' => $conversation['conversation_type'],
        'title' => $title,
        'room' => $conversation['room_name'],
        'year_level' => $conversation['year_level'],
        'strand' => $conversation['strand'],
        'level' => $conversation['room_level'],
        'last_message' => $lastMessage['message_text'] ?? '',
        'last_sender' => $lastMessage['sender_name'] ?? '',
        'updated_at' => $lastMessage['created_at'] ?? $conversation['updated_at'],
        'unread_count' => $unreadCount,
    ];
}

function chatMarkRead(mysqli $conn, int $conversationId, string $readerRole, int $readerId): void
{
    $stmt = $conn->prepare('INSERT INTO student_chat_reads
        (conversation_id, reader_role, reader_id, last_read_message_id)
        SELECT ?, ?, ?, COALESCE(MAX(id), 0)
        FROM student_chat_messages WHERE conversation_id = ?
        ON DUPLICATE KEY UPDATE last_read_message_id = GREATEST(last_read_message_id, VALUES(last_read_message_id))');
    $stmt->bind_param('isii', $conversationId, $readerRole, $readerId, $conversationId);
    $stmt->execute();
    $stmt->close();
}

function chatAccessibleConversation(mysqli $conn, array $user, string $role, int $conversationId): array
{
    $stmt = $conn->prepare('SELECT * FROM student_chat_conversations WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $conversationId);
    $stmt->execute();
    $conversation = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$conversation) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Chat conversation not found.']);
        exit();
    }

    if ($role === 'staff' && ($user['role'] ?? '') === 'purple_admin') {
        if ($conversation['conversation_type'] !== 'staff' || empty($conversation['student_lrn'])) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Administrators can access direct student conversations only.']);
            exit();
        }
    } elseif ($role === 'staff') {
        if (($user['role'] ?? '') !== 'purple_teacher' || $conversation['conversation_type'] !== 'section') {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Teachers can access assigned room conversations only.']);
            exit();
        }
        teacherEnsureRoomSchema($conn);
        $teacherId = (int) ($user['user_id'] ?? 0);
        $roomName = (string) $conversation['room_name'];
        $yearLevel = (string) $conversation['year_level'];
        $stmt = $conn->prepare('SELECT 1
            FROM teacher_advisory_rooms a
            JOIN rooms r ON r.id = a.room_id
            WHERE a.teacher_user_id = ? AND r.room_name = ? AND r.year_level = ?
              AND r.level = ?
            LIMIT 1');
        $roomLevel = (string) $conversation['room_level'];
        $stmt->bind_param('isss', $teacherId, $roomName, $yearLevel, $roomLevel);
        $stmt->execute();
        $assigned = (bool) $stmt->get_result()->fetch_row();
        $stmt->close();
        if (!$assigned) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'This room is not assigned to your account.']);
            exit();
        }
    } else {
        $student = chatStudentRecord($conn, $user);
        $sectionConversationIds = chatStudentConversationIds($conn, $student);
        if (!in_array($conversationId, $sectionConversationIds, true)) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'You do not have access to this conversation.']);
            exit();
        }
    }

    return $conversation;
}
