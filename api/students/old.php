<?php
// api/students/old.php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

// Multipart form data — fields come from $_POST, file from $_FILES
$lrn = isset($_POST['lrn_old']) ? trim($_POST['lrn_old']) : '';
$year_level = isset($_POST['yr_lvl_old']) ? trim($_POST['yr_lvl_old']) : '';
$last_name = isset($_POST['lname_old']) ? trim($_POST['lname_old']) : '';
$first_name = isset($_POST['fname_old']) ? trim($_POST['fname_old']) : '';
$middle_name = isset($_POST['mname_old']) ? trim($_POST['mname_old']) : null;
$ext_name = isset($_POST['extname_old']) ? trim($_POST['extname_old']) : null;
$age = isset($_POST['age_old']) ? intval($_POST['age_old']) : null;
$birthday = isset($_POST['birthday_old']) ? trim($_POST['birthday_old']) : '';
$gender = isset($_POST['gender_old']) ? trim($_POST['gender_old']) : '';
$phone = isset($_POST['phone_old']) ? trim($_POST['phone_old']) : '';
$email = isset($_POST['email_old']) ? filter_var($_POST['email_old'], FILTER_SANITIZE_EMAIL) : '';
$strand = isset($_POST['strand_old']) ? trim($_POST['strand_old']) : null;

$primary_address = isset($_POST['prim_add_old']) ? trim($_POST['prim_add_old']) : '';
$secondary_address = isset($_POST['sec_add_old']) ? trim($_POST['sec_add_old']) : '';
$zip_code = isset($_POST['zip_code_old']) ? trim($_POST['zip_code_old']) : '';

$parent_name = isset($_POST['parent_name_old']) ? trim($_POST['parent_name_old']) : null;
$parent_address = isset($_POST['parent_add_old']) ? trim($_POST['parent_add_old']) : null;
$parent_relationship = isset($_POST['parent_rel_old']) ? trim($_POST['parent_rel_old']) : null;
$parent_phone = isset($_POST['parent_phone_old']) ? trim($_POST['parent_phone_old']) : null;

// Required field validation — matches original die() checks, but returns JSON instead
$required = [
    'lrn_old' => $lrn,
    'yr_lvl_old' => $year_level,
    'lname_old' => $last_name,
    'fname_old' => $first_name,
    'age_old' => $age,
    'birthday_old' => $birthday,
    'gender_old' => $gender,
    'phone_old' => $phone,
    'email_old' => $email,
];

foreach ($required as $field => $value) {
    if (empty($value)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "$field is required."]);
        exit();
    }
}

// Check duplicate LRN
$checkStmt = $conn->prepare("SELECT COUNT(*) FROM old_student_info WHERE lrn_old = ?");
$checkStmt->bind_param("s", $lrn);
$checkStmt->execute();
$checkStmt->bind_result($count);
$checkStmt->fetch();
$checkStmt->close();

if ($count > 0) {
    http_response_code(409); // Conflict
    echo json_encode(["success" => false, "message" => "This enrollee already exists. Duplicate entry is not allowed."]);
    exit();
}

// File upload handler
function uploadFile($fileInput, $destinationFolder = __DIR__ . '/../uploads/')
{
    if (isset($_FILES[$fileInput]) && $_FILES[$fileInput]['error'] == 0) {
        if (!is_dir($destinationFolder)) {
            mkdir($destinationFolder, 0755, true);
        }
        $filename = basename($_FILES[$fileInput]["name"]);
        $targetFilePath = $destinationFolder . time() . "_" . $filename;
        move_uploaded_file($_FILES[$fileInput]["tmp_name"], $targetFilePath);
        return "uploads/" . basename($targetFilePath);
    }
    return null;
}

$id_pic_old = uploadFile('id_pic_old');

if (!$id_pic_old) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "2x2 ID photo is required."]);
    exit();
}

$conn->begin_transaction();

try {
    $stmt1 = $conn->prepare("INSERT INTO old_student_info 
        (lrn_old, yr_lvl_old, strand_old, lname_old, fname_old, mname_old, extname_old, age_old, bday_old, gender_old, phone_old, email_old) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt1->bind_param("sssssssissss", $lrn, $year_level, $strand, $last_name, $first_name, $middle_name, $ext_name, $age, $birthday, $gender, $phone, $email);
    $stmt1->execute();
    $id_old = $stmt1->insert_id;
    $stmt1->close();

    $stmt2 = $conn->prepare("INSERT INTO old_student_address (prim_add_old, sec_add_old, zip_code_old) VALUES (?, ?, ?)");
    $stmt2->bind_param("sss", $primary_address, $secondary_address, $zip_code);
    $stmt2->execute();
    $stmt2->close();

    $stmt3 = $conn->prepare("INSERT INTO old_student_parent (parent_name_old, parent_add_old, parent_rel_old, parent_phone_old) VALUES (?, ?, ?, ?)");
    $stmt3->bind_param("ssss", $parent_name, $parent_address, $parent_relationship, $parent_phone);
    $stmt3->execute();
    $stmt3->close();

    $stmt4 = $conn->prepare("INSERT INTO old_student_req (id_pic_old) VALUES (?)");
    $stmt4->bind_param("s", $id_pic_old);
    $stmt4->execute();
    $stmt4->close();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "New record created successfully!",
        "id_old" => $id_old
    ]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error creating record: " . $e->getMessage()]);
}

$conn->close();