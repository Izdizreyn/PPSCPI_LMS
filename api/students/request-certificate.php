<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);

$lrn = trim($input['lrn'] ?? '');
$purpose = trim($input['purpose'] ?? '');

if (empty($lrn) || empty($purpose)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "LRN and purpose are required."]);
    exit();
}

$manualEntry = !empty($input['full_name']);

if ($manualEntry) {
    $fullName = trim($input['full_name']);
    $yearLevel = trim($input['year_level'] ?? '');
    $strand = trim($input['strand'] ?? '');
    $room = trim($input['room'] ?? '');
    $level = trim($input['level'] ?? '');
    $studentFound = true;
} else {
    $studentFound = false;
    $fullName = $yearLevel = $strand = $room = $level = '';

    // 1. Check enrolled_students first — already has room/level assigned
    $stmt = $conn->prepare("SELECT * FROM enrolled_students WHERE lrn = ?");
    $stmt->bind_param("s", $lrn);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $fullName = $row['full_name'];
        $yearLevel = $row['year_level'];
        $strand = $row['strand'] ?? '';
        $room = $row['room'];
        $level = $row['level'];
        $studentFound = true;
    }
    $stmt->close();

    // 2. Fall back to intake tables if not yet room-assigned
    if (!$studentFound) {
        $tables = [
            'new' => ['table' => 'new_student_info', 'lrn' => 'lrn_new', 'fname' => 'fname_new', 'mname' => 'mname_new', 'lname' => 'lname_new', 'yr' => 'yr_lvl_new', 'strand' => 'strand_new'],
            'old' => ['table' => 'old_student_info', 'lrn' => 'lrn_old', 'fname' => 'fname_old', 'mname' => 'mname_old', 'lname' => 'lname_old', 'yr' => 'yr_lvl_old', 'strand' => 'strand_old'],
            'transferee' => ['table' => 'transferee_info', 'lrn' => 'lrn_trans', 'fname' => 'fname_trans', 'mname' => 'mname_trans', 'lname' => 'lname_trans', 'yr' => 'yr_lvl_trans', 'strand' => 'strand_trans'],
        ];

        foreach ($tables as $t) {
            $stmt = $conn->prepare("SELECT * FROM {$t['table']} WHERE {$t['lrn']} = ?");
            $stmt->bind_param("s", $lrn);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                $fullName = trim($row[$t['fname']] . ' ' . $row[$t['mname']] . ' ' . $row[$t['lname']]);
                $yearLevel = $row[$t['yr']];
                $strand = $row[$t['strand']] ?? '';
                $room = ''; // not yet room-assigned — matches original fallback behavior
                $level = $yearLevel >= 11 ? 'Senior High School' : ($yearLevel >= 7 ? 'Junior High School' : ($yearLevel >= 1 ? 'Elementary' : $yearLevel));
                $studentFound = true;
                $stmt->close();
                break;
            }
            $stmt->close();
        }
    }
}

if (!$studentFound) {
    http_response_code(404);
    echo json_encode([
        "success" => false,
        "student_not_found" => true,
        "message" => "Student with LRN $lrn not found in any database table. Please enter your details below.",
    ]);
    exit();
}

$requestDate = date("Y-m-d H:i:s");
$status = "Pending";

$stmt = $conn->prepare("INSERT INTO certificate_requests (lrn, full_name, year_level, strand, room, level, purpose, request_date, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sssssssss", $lrn, $fullName, $yearLevel, $strand, $room, $level, $purpose, $requestDate, $status);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Certificate request submitted successfully!"]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error submitting request: " . $conn->error]);
}

$stmt->close();
$conn->close();