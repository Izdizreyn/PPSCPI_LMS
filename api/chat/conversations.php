<?php
require_once __DIR__ . '/../helpers/chat_helper.php';

$user = requireAuth();
$role = chatRole($user);
chatEnsureSchema($conn);
$readerId = (int) ($user['user_id'] ?? 0);
$conversations = [];

if ($role === 'student') {
    $student = chatStudentRecord($conn, $user);
    $conversationIds = chatStudentConversationIds($conn, $student);

    foreach ($conversationIds as $conversationId) {
        $conversationId = (int) $conversationId;
        $stmt = $conn->prepare('SELECT * FROM student_chat_conversations WHERE id = ?');
        $stmt->bind_param('i', $conversationId);
        $stmt->execute();
        $conversation = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if ($conversation) {
            if ($conversation['conversation_type'] === 'staff') {
                $title = 'Faculty / Admin Chat';
            } else {
                $title = 'Room ' . $student['room'] . ' Chat';
                if (stripos((string) $student['level'], 'Senior High') !== false) {
                    $title .= ' - ' . $student['strand'];
                }
            }
            $conversations[] = chatConversationSummary($conn, $conversation, $role, $readerId, $title);
        }
    }
} elseif (($user['role'] ?? '') === 'purple_admin') {
    $stmt = $conn->prepare('SELECT c.*, s.full_name
        FROM student_chat_conversations c
        LEFT JOIN students s ON s.lrn = c.student_lrn
        WHERE c.conversation_type = "staff" AND c.student_lrn IS NOT NULL
        ORDER BY c.updated_at DESC');
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    foreach ($rows as $conversation) {
        $title = trim((string) ($conversation['full_name'] ?? ''));
        if ($title === '') {
            $title = 'Student ' . $conversation['student_lrn'];
        }
        $conversations[] = chatConversationSummary(
            $conn,
            $conversation,
            $role,
            $readerId,
            $title
        );
    }
} else {
    teacherEnsureRoomSchema($conn);
    $teacherId = $readerId;
    $stmt = $conn->prepare('SELECT r.id AS room_id, r.room_name, r.year_level, r.level,
            es.lrn, es.full_name, es.strand
        FROM teacher_advisory_rooms a
        JOIN rooms r ON r.id = a.room_id
        LEFT JOIN enrolled_students es
            ON es.room = r.room_name
            AND es.year_level = r.year_level
            AND es.level = r.level
        WHERE a.teacher_user_id = ?
        ORDER BY r.room_name, es.full_name');
    $stmt->bind_param('i', $teacherId);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    $groups = [];
    foreach ($rows as $row) {
        $isSeniorHigh = stripos((string) $row['level'], 'Senior High') !== false;
        $strand = $isSeniorHigh ? trim((string) ($row['strand'] ?? '')) : '';
        if ($isSeniorHigh && $strand === '') {
            continue;
        }

        $level = trim((string) $row['level']);
        $groupKey = implode('|', [(int) $row['room_id'], $level, $strand]);
        if (!isset($groups[$groupKey])) {
            $roomDetails = [
                'room' => trim((string) $row['room_name']),
                'year_level' => trim((string) $row['year_level']),
                'strand' => $strand,
                'level' => $level,
            ];
            $sectionKey = 'section:' . hash('sha256', json_encode($roomDetails));
            $groups[$groupKey] = [
                'conversation_id' => chatGetOrCreateConversation(
                    $conn,
                    $sectionKey,
                    'section',
                    null,
                    $roomDetails['room'],
                    $roomDetails['year_level'],
                    $roomDetails['strand'],
                    $roomDetails['level']
                ),
                'room' => $row['room_name'],
                'year_level' => $row['year_level'],
                'strand' => $strand,
                'students' => [],
            ];
        }

        if (!empty($row['lrn'])) {
            $groups[$groupKey]['students'][] = [
                'lrn' => $row['lrn'],
                'full_name' => $row['full_name'],
            ];
        }
    }

    foreach ($groups as $group) {
        $conversationId = (int) $group['conversation_id'];
        $stmt = $conn->prepare('SELECT * FROM student_chat_conversations WHERE id = ?');
        $stmt->bind_param('i', $conversationId);
        $stmt->execute();
        $conversation = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$conversation) {
            continue;
        }
        $title = 'Room ' . $group['room'] . ' Chat';
        if ($group['strand'] !== '') {
            $title .= ' - ' . $group['strand'];
        }
        $summary = chatConversationSummary($conn, $conversation, $role, $readerId, $title);
        $summary['students'] = $group['students'];
        $conversations[] = $summary;
    }
}

usort($conversations, static fn($a, $b) => strcmp((string) $b['updated_at'], (string) $a['updated_at']));
echo json_encode(['success' => true, 'conversations' => $conversations]);
$conn->close();
