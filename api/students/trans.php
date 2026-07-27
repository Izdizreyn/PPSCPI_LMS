<?php
// api/students/trans.php

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed."]);
    exit();
}

// Multipart form data — fields come from $_POST, files from $_FILES
$lrn = isset($_POST['lrn_trans']) ? trim($_POST['lrn_trans']) : '';
$year_level = isset($_POST['yr_lvl_trans']) ? trim($_POST['yr_lvl_trans']) : '';
$last_name = isset($_POST['lname_trans']) ? trim($_POST['lname_trans']) : '';
$first_name = isset($_POST['fname_trans']) ? trim($_POST['fname_trans']) : '';
$middle_name = isset($_POST['mname_trans']) ? trim($_POST['mname_trans']) : '';
$ext_name = isset($_POST['extname_trans']) ? trim($_POST['extname_trans']) : '';
$age = isset($_POST['age_trans']) ? intval($_POST['age_trans']) : null;
$birthday = isset($_POST['birthday_trans']) ? trim($_POST['birthday_trans']) : '';
$gender = isset($_POST['gender_trans']) ? trim($_POST['gender_trans']) : '';
$phone = isset($_POST['phone_trans']) ? trim($_POST['phone_trans']) : '';
$email = isset($_POST['email_trans']) ? filter_var($_POST['email_trans'], FILTER_SANITIZE_EMAIL) : '';
$strand = isset($_POST['strand_trans']) ? trim($_POST['strand_trans']) : '';

$primary_address = isset($_POST['prim_add_trans']) ? trim($_POST['prim_add_trans']) : '';
$secondary_address = isset($_POST['sec_add_trans']) ? trim($_POST['sec_add_trans']) : '';
$zip_code = isset($_POST['zip_code_trans']) ? trim($_POST['zip_code_trans']) : '';

$parent_name = isset($_POST['parent_name_trans']) ? trim($_POST['parent_name_trans']) : '';
$parent_address = isset($_POST['parent_add_trans']) ? trim($_POST['parent_add_trans']) : '';
$parent_relationship = isset($_POST['parent_rel_trans']) ? trim($_POST['parent_rel_trans']) : '';
$parent_phone = isset($_POST['parent_phone_trans']) ? trim($_POST['parent_phone_trans']) : '';

// Required field validation
$required = [
    'lrn_trans' => $lrn,
    'yr_lvl_trans' => $year_level,
    'lname_trans' => $last_name,
    'fname_trans' => $first_name,
    'age_trans' => $age,
    'birthday_trans' => $birthday,
    'gender_trans' => $gender,
    'phone_trans' => $phone,
    'email_trans' => $email,
];

foreach ($required as $field => $value) {
    if (empty($value)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "$field is required."]);
        exit();
    }
}

// Check duplicate LRN
$checkStmt = $conn->prepare("SELECT COUNT(*) FROM transferee_info WHERE lrn_trans = ?");
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

$form137 = uploadFile('form_137_trans');
$good_moral = uploadFile('gmorale_trans');
$certificate = uploadFile('cert_trans');
$tor = uploadFile('tor_trans');
$id_2x2 = uploadFile('2x2_id_trans');

$requiredFiles = [
    'Form 137' => $form137,
    'Certificate of Good Morale' => $good_moral,
    'Certificate of Enrollment' => $certificate,
    'Transcript of Record' => $tor,
    '2x2 ID' => $id_2x2,
];

foreach ($requiredFiles as $label => $value) {
    if (!$value) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "$label is required."]);
        exit();
    }
}

$conn->begin_transaction();

try {
    $stmt1 = $conn->prepare("INSERT INTO transferee_info 
        (lrn_trans, yr_lvl_trans, strand_trans, lname_trans, fname_trans, mname_trans, extname_trans, age_trans, bday_trans, gender_trans, phone_trans, email_trans) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt1->bind_param("sssssssissss", $lrn, $year_level, $strand, $last_name, $first_name, $middle_name, $ext_name, $age, $birthday, $gender, $phone, $email);
    $stmt1->execute();
    $id_trans = $stmt1->insert_id;
    $stmt1->close();

    $stmt2 = $conn->prepare("INSERT INTO transferee_address (id_add_trans, prim_add_trans, sec_add_trans, zip_code_trans) VALUES (?, ?, ?, ?)");
    $stmt2->bind_param("isss", $id_trans, $primary_address, $secondary_address, $zip_code);
    $stmt2->execute();
    $stmt2->close();

    $stmt3 = $conn->prepare("INSERT INTO transferee_parent (id_par_trans, parent_name_trans, parent_add_trans, parent_rel_trans, parent_phone_trans) VALUES (?, ?, ?, ?, ?)");
    $stmt3->bind_param("issss", $id_trans, $parent_name, $parent_address, $parent_relationship, $parent_phone);
    $stmt3->execute();
    $stmt3->close();

    $stmt4 = $conn->prepare("INSERT INTO transferee_req (id_req_trans, form137_trans, gmorale_trans, cert_trans, tor_trans, id_pic_trans) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt4->bind_param("isssss", $id_trans, $form137, $good_moral, $certificate, $tor, $id_2x2);
    $stmt4->execute();
    $stmt4->close();

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "New record created successfully!",
        "id_trans" => $id_trans
    ]);
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Error creating record: " . $e->getMessage()]);
}

$conn->close();