<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

function g_user(array $roles): array {
    return (array) requireRole($roles);
}

function g_json($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function g_body(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

function g_school_year(?string $sy = null): string {
    if ($sy && preg_match('/^\d{4}-\d{4}$/', $sy)) return $sy;
    $y = (int) date('Y');
    return ((int) date('n') >= 6) ? "$y-" . ($y + 1) : ($y - 1) . "-$y";
}

function g_quarter($q): int {
    $q = (int) $q;
    if ($q < 1 || $q > 4) g_json(['success' => false, 'message' => 'Quarter must be 1-4.'], 400);
    return $q;
}

function g_audit(mysqli $conn, int $gradeId, int $actor, string $action, $old, $new): void {
    $stmt = $conn->prepare('INSERT INTO grade_audit_log (grade_id, actor_user_id, action, old_value, new_value) VALUES (?,?,?,?,?)');
    $oldStr = $old === null ? null : (string) $old;
    $newStr = $new === null ? null : (string) $new;
    $stmt->bind_param('iisss', $gradeId, $actor, $action, $oldStr, $newStr);
    $stmt->execute();
    $stmt->close();
}

// The enrolled student this grade entry is for, or 403 if not enrolled.
function g_student(mysqli $conn, string $lrn): array {
    $stmt = $conn->prepare('SELECT lrn, full_name, year_level, strand, room, level FROM enrolled_students WHERE lrn = ?');
    $stmt->bind_param('s', $lrn);
    $stmt->execute();
    $s = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$s) g_json(['success' => false, 'message' => 'Student not found in enrolled students.'], 404);
    return $s;
}

// Subjects that apply to this student's year level (and strand, if set).
function g_subjects_for(mysqli $conn, string $yearLevel, ?string $strand): array {
    $stmt = $conn->prepare('SELECT id, name FROM subjects WHERE year_level = ? AND (strand IS NULL OR strand = ?) ORDER BY name');
    $strandParam = $strand ?? '';
    $stmt->bind_param('ss', $yearLevel, $strandParam);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    return $rows;
}
