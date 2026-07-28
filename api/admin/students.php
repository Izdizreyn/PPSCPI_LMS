<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

requireRole(['purple_admin']);

function fetchStudents($conn, $table, $prefix) {
    $sql = "SELECT * FROM $table";
    $result = $conn->query($sql);
    $students = [];
    while ($row = $result->fetch_assoc()) {
        $fullName = $row["fname_$prefix"] . " " . $row["mname_$prefix"] . " " . $row["lname_$prefix"];
        if (!empty($row["extname_$prefix"])) {
            $fullName .= " " . $row["extname_$prefix"];
        }
        $students[] = [
            "id" => $row["id_$prefix"],
            "lrn" => $row["lrn_$prefix"],
            "full_name" => $fullName,
            "year_level" => $row["yr_lvl_$prefix"],
            "strand" => $row["strand_$prefix"],
            "gender" => $row["gender_$prefix"],
            "status" => $row["status_$prefix"] ?? "Pending",
        ];
    }
    return $students;
}

echo json_encode([
    "success" => true,
    "new" => fetchStudents($conn, "new_student_info", "new"),
    "old" => fetchStudents($conn, "old_student_info", "old"),
    "transferee" => fetchStudents($conn, "transferee_info", "trans"),
]);

$conn->close();