<?php
require_once __DIR__ . '/../helpers/chat_helper.php';

$user = requireAuth();
$role = chatRole($user);
chatEnsureSchema($conn);
$readerId = (int) ($user['user_id'] ?? 0);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $conversationId = filter_input(INPUT_GET, 'conversation_id', FILTER_VALIDATE_INT);
    if (!$conversationId || $conversationId < 1) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'A valid conversation ID is required.']);
        exit();
    }

    chatAccessibleConversation($conn, $user, $role, $conversationId);
    $afterId = max(0, (int) ($_GET['after_id'] ?? 0));
    chatMarkRead($conn, $conversationId, $role, $readerId);

    if ($afterId === 0) {
        $stmt = $conn->prepare('SELECT id, sender_role, sender_id, sender_lrn, sender_name, message_text, created_at
            FROM student_chat_messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 200');
        $stmt->bind_param('i', $conversationId);
    } else {
        $stmt = $conn->prepare('SELECT id, sender_role, sender_id, sender_lrn, sender_name, message_text, created_at
            FROM student_chat_messages WHERE conversation_id = ? AND id > ? ORDER BY id ASC LIMIT 100');
        $stmt->bind_param('ii', $conversationId, $afterId);
    }
    $stmt->execute();
    $messages = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    if ($afterId === 0) {
        $messages = array_reverse($messages);
    }
    echo json_encode(['success' => true, 'messages' => $messages]);
    $conn->close();
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $conversationId = filter_var($body['conversation_id'] ?? null, FILTER_VALIDATE_INT);
    $messageText = trim((string) ($body['message'] ?? ''));
    $messageLength = function_exists('mb_strlen') ? mb_strlen($messageText, 'UTF-8') : strlen($messageText);

    if (!$conversationId || $conversationId < 1 || $messageLength < 1 || $messageLength > 2000) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'A conversation and a message of 1-2000 characters are required.']);
        exit();
    }

    $conversation = chatAccessibleConversation($conn, $user, $role, $conversationId);
    $senderId = (int) ($user['user_id'] ?? 0);
    if ($senderId < 1) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'The account could not be identified. Please sign in again.']);
        exit();
    }

    if ($role === 'student') {
        $student = chatStudentRecord($conn, $user);
        if ($conversation['conversation_type'] === 'section') {
            $sectionConversationIds = chatStudentConversationIds($conn, $student);
            if (!in_array($conversationId, $sectionConversationIds, true)) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'You are no longer a member of this room chat.']);
                exit();
            }
        }
        $senderName = (string) $student['full_name'];
        $senderLrn = (string) $student['lrn'];
    } else {
        if (($user['role'] ?? '') === 'purple_admin') {
            $senderName = 'School Admin';
        } else {
            $senderName = trim((string) ($user['username'] ?? $user['email'] ?? ''));
            $senderName = $senderName !== '' ? $senderName : 'Faculty';
        }
        $senderLrn = null;
    }

    $stmt = $conn->prepare('INSERT INTO student_chat_messages
        (conversation_id, sender_role, sender_id, sender_lrn, sender_name, message_text)
        VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->bind_param('isisss', $conversationId, $role, $senderId, $senderLrn, $senderName, $messageText);
    $stmt->execute();
    $messageId = $stmt->insert_id;
    $stmt->close();

    $updateStmt = $conn->prepare('UPDATE student_chat_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    $updateStmt->bind_param('i', $conversationId);
    $updateStmt->execute();
    $updateStmt->close();
    chatMarkRead($conn, $conversationId, $role, $senderId);

    $fetchStmt = $conn->prepare('SELECT id, sender_role, sender_id, sender_lrn, sender_name, message_text, created_at
        FROM student_chat_messages WHERE id = ? LIMIT 1');
    $fetchStmt->bind_param('i', $messageId);
    $fetchStmt->execute();
    $message = $fetchStmt->get_result()->fetch_assoc();
    $fetchStmt->close();

    echo json_encode(['success' => true, 'message' => $message]);
    $conn->close();
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
