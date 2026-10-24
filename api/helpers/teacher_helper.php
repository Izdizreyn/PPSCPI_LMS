<?php

function teacherEnsureRoomSchema(mysqli $conn): void
{
    $result = $conn->query("CREATE TABLE IF NOT EXISTS teacher_advisory_rooms (
        teacher_user_id INT NOT NULL,
        room_id INT NOT NULL,
        assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (teacher_user_id, room_id),
        UNIQUE KEY uq_teacher_advisory_room (room_id),
        CONSTRAINT fk_teacher_advisory_user
            FOREIGN KEY (teacher_user_id) REFERENCES admin(id_admin) ON DELETE CASCADE,
        CONSTRAINT fk_teacher_advisory_room
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    if (!$result) {
        throw new RuntimeException('Teacher room assignments could not be initialized.');
    }
}

function teacherEnsureUsernameIndex(mysqli $conn): void
{
    $index = $conn->query("SHOW INDEX FROM admin WHERE Key_name = 'uq_admin_username'");
    if (!$index) {
        throw new RuntimeException('Admin username indexes could not be inspected.');
    }
    if ($index->num_rows > 0) {
        return;
    }

    $duplicates = $conn->query('SELECT COUNT(*) AS duplicate_groups
        FROM (
            SELECT username_admin
            FROM admin
            GROUP BY username_admin
            HAVING COUNT(*) > 1
        ) AS duplicate_usernames');
    if (!$duplicates) {
        throw new RuntimeException('Admin usernames could not be checked for duplicates.');
    }
    if ((int) $duplicates->fetch_assoc()['duplicate_groups'] > 0) {
        throw new RuntimeException('Duplicate admin usernames must be resolved before teacher accounts can be created.');
    }
    if (!$conn->query('ALTER TABLE admin ADD UNIQUE KEY uq_admin_username (username_admin)')) {
        throw new RuntimeException('A unique admin username index could not be created.');
    }
}

function teacherCanAccessStudent(mysqli $conn, int $teacherId, array $student): bool
{
    teacherEnsureRoomSchema($conn);

    $stmt = $conn->prepare('SELECT 1
        FROM teacher_advisory_rooms a
        JOIN rooms r ON r.id = a.room_id
        WHERE a.teacher_user_id = ?
          AND r.room_name = ?
          AND r.year_level = ?
          AND r.level = ?
        LIMIT 1');
    $stmt->bind_param(
        'isss',
        $teacherId,
        $student['room'],
        $student['year_level'],
        $student['level']
    );
    $stmt->execute();
    $allowed = (bool) $stmt->get_result()->fetch_row();
    $stmt->close();

    return $allowed;
}
