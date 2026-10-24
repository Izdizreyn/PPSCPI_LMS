<?php
// api/admin/import-old-student.php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/auth.php';

requireRole(['purple_admin']);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true);

$lrn = trim($input['lrn'] ?? '');
$fname = trim($input['fname'] ?? '');
$lname = trim($input['lname'] ?? '');
$birthday = trim($input['birthday'] ?? '');
$lastYearLevel = trim($input['last_year_level'] ?? '');

if (empty($lrn) || empty($fname) || empty($lname) || empty($birthday) || empty($lastYearLevel)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "LRN, name, birthday, and last year level are required."]);
    exit();
}

$stmt = $conn->prepare("SELECT id FROM student_master_records WHERE lrn = ?");
$stmt->bind_param("s", $lrn);
$stmt->execute();
$existing = $stmt->get_result()->fetch_assoc();
$stmt->close();

if ($existing) {
    http_response_code(409);
    echo json_encode(["success" => false, "message" => "A record with this LRN already exists."]);
    exit();
}

$stmt = $conn->prepare(
    "INSERT INTO student_master_records
        (lrn, fname, mname, lname, extname, birthday, gender, phone, email,
         prim_add, sec_add, zip_code, parent_name, parent_phone, parent_rel, parent_add,
         last_year_level, last_strand)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
);

$mname = trim($input['mname'] ?? '');
$extname = trim($input['extname'] ?? '');
$gender = trim($input['gender'] ?? '');
$phone = trim($input['phone'] ?? '');
$email = trim($input['email'] ?? '');
$primAdd = trim($input['prim_add'] ?? '');
$secAdd = trim($input['sec_add'] ?? '');
$zipCode = trim($input['zip_code'] ?? '');
$parentName = trim($input['parent_name'] ?? '');
$parentPhone = trim($input['parent_phone'] ?? '');
$parentRel = trim($input['parent_rel'] ?? '');
$parentAdd = trim($input['parent_add'] ?? '');
$lastStrand = trim($input['last_strand'] ?? '');

$stmt->bind_param(
    "ssssssssssssssssss",
    $lrn, $fname, $mname, $lname, $extname, $birthday, $gender, $phone, $email,
    $primAdd, $secAdd, $zipCode, $parentName, $parentPhone, $parentRel, $parentAdd,
    $lastYearLevel, $lastStrand
);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Historical record saved."]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to save record: " . $stmt->error]);
}

$stmt->close();
$conn->close();